
var Crew = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options = {};

      this.ball    = options.ball || null;
      this.courage = options.courage || 0;
      this.badass  = options.badass  || 0;
      
      this.fear    = 0; // 1 = scared, -1 = happy
      this.fear_lowpass = new Lowpass(0.8);

      this.shakiness = 0;

      this.seed = Math.random();

    },
    update: function() {
      var velocity = distance2d(this.ball.body.velocity);
      var force = distance2d(this.ball.body.force);

      this.fear_lowpass.filter(force * 0.04 + velocity * 0.02 - 0.3 * (1-this.courage));
      this.shakiness = velocity * 0.01;

      this.fear = clamp(-2, this.fear_lowpass.value, 2);

      this.fear *= 1-this.badass * 0.5;
      this.fear -= this.badass * 0.5;
    }
  };
});

var Hit = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options = {};

      this.hitter     = options.hitter || null;
                      
      this.position = options.position || 0;
      this.speed    = options.speed || 0;
      this.force    = options.force || 0;

      this.lifetime = options.lifetime || 0.2;

      this.time     = time();

    },
    getAge: function() {
      return Math.max(0, Math.abs(this.time - time()));
    },
    isDead: function() {
      if(this.getAge() > this.lifetime) return true;
      return false;
    }
  };
});

var Obstacle = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options = {};

      this.type       = options.type || "circle";

      this.parent     = options.parent || null;
      this.distance   = options.distance || 10;
      this.speed      = options.speed || 1;
      this.along      = options.along || 0;

      this.color      = new Color("#fff");
      if(options.color) this.color.set(options.color);

      this.position   = options.position || [0, 0];
      this.size       = options.size || 1;
      this.attraction = options.attraction || 0;

      // soi: distance from this.position[] to arbitrary distance based off attraction
      this.soi        = this.attraction * 0.05;

      this.hits       = [];

      this.addPhysicsShape();
    },
    withinSOI: function(pos) {
      if(distance2d(pos, this.position) < this.soi + this.size) return true;
      return false;
    },
    addPhysicsShape: function() {
      this.shape = new p2.Circle(this.size * 2);
//      prop.physics.obstacles.addShape(this.shape, this.position);
    },
    removePhysicsShape: function() {
      prop.physics.obstacles.removeShape(this.shape);
    },
    addHit: function(hit) {
      if(this.canHit) {
        for(var i=0;i<this.hits.length;i++) {
          if(this.hits[i].hitter == hit.hitter && equals(this.hits[i].time, time(), 0.2)) {
            return;
          }
        }
        this.hits.push(hit);
      }
      this.canHit = false;
    },
    update: function() {
      if(this.parent) {
        this.along += this.speed * delta();

//        var shape_index = prop.physics.obstacles

        this.position[0] = this.distance * Math.sin(this.along) + this.parent.position[0];
        this.position[1] = this.distance * Math.cos(this.along) + this.parent.position[1];
      }
      this.canHit = true;
      var removal = [];
      for(var i=0;i<this.hits.length;i++) {
        if(this.hits[i].isDead()) {
          removal.push(i);
        }
      }
      for(var i=0;i<removal.length;i++) {
        this.hits.splice(removal[i] - i, 1);
      }
    }
  };
});

var Ball = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options = {};

      this.position = options.position || [0, 20];
      this.size     = options.size || 1.2;
      this.mass     = options.mass || 100;

      this.path     = [];

      this.addPhysicsBody();
    },
    addPhysicsBody: function() {
      this.body  = new p2.Body({
        position: this.position,
        mass:     1.0,
      });
      this.shape = new p2.Circle(this.size);
      this.body.addShape(this.shape);

      prop.physics.world.addBody(this.body);

    },
    removePhysicsBody: function() {
      prop.physics.world.removeBody(this.body);
    },
    update_pre: function() {
      var force = [0, 0];

      for(var i=0;i<prop.pinball.obstacles.length;i++) {
        var obstacle  = prop.pinball.obstacles[i]

        var distance  = distance2d(this.position, obstacle.position);
        var pull      = ((obstacle.attraction * this.mass) / (distance * distance)) / prop.physics.steps;

        if(distance < (this.size + obstacle.size) + 0.05) {
          obstacle.addHit(new Hit({
            hitter: this,
            position: obstacle.position,
            speed: distance2d([0, 0], this.body.velocity),
            force: pull,
          }));
          pull *= -15;
          pull = clamp(-10000, pull, -3000);
        }

        var direction = Math.atan2((obstacle.position[0] - this.position[0]),
                                   (obstacle.position[1] - this.position[1]));
        
        var f         = [pull * Math.sin(direction), pull * Math.cos(direction)];
        force[0] += f[0];
        force[1] += f[1];

        if(obstacle.withinSOI(this.position)) {
//          prop.pinball.speed = 0.05;
        }
      }

      this.body.force[0] = force[0];
      this.body.force[1] = force[1];

      var f = distance2d([0, 0], force);
//      prop.pinball.speed = crange(300, f, 700, 1, 0.1);

    },
    update_post: function() {

      if(this.body.position[0] < -prop.pinball.size[0] / 2 + this.size) {
        this.body.position[0] = -prop.pinball.size[0] / 2 + this.size;
        this.body.velocity[0] =  Math.abs(this.body.velocity[0]);
      }
      if(this.body.position[0] > prop.pinball.size[0] / 2 - this.size) {
        this.body.position[0] =  prop.pinball.size[0] / 2 - this.size;
        this.body.velocity[0] = -Math.abs(this.body.velocity[0]);
      }

      if(this.body.position[1] > prop.pinball.size[1] - this.size) {
        this.body.position[1] =  prop.pinball.size[1] - this.size;
        this.body.velocity[1] = -Math.abs(this.body.velocity[1]);
      }

      this.position[0] = this.body.position[0];
      this.position[1] = this.body.position[1];

      if(this.path.length >= 1 && distance2d(this.position, this.path[this.path.length-1]) < 0.1) return;
      this.path.push([this.position[0], this.position[1]]);
      if(this.path.length > prop.pinball.path_length) {
        this.path.splice(0, this.path.length - prop.pinball.path_length);
      }
    },
  };
});

var Paddle = Fiber.extend(function() {
  return {
    init: function(side) {

      this.position = [prop.pinball.size[0] * 0.1, 4.4];
      this.side     = side;

      this.angle    = 0;
      this.angle_lowpass = new Lowpass(0.6);

      this.addPhysicsBody();
    },
    addPhysicsBody: function() {
      
      var s = this.side;
      this.verts = [];
      var d = 1.5;

      this.verts.push([prop.pinball.size[0] * 0.08, -0.0]);

      for(var i=0;i<220;i+=20) {
        this.verts.push([-Math.sin(radians(i)) * d, Math.cos(radians(i)) * d]);
      }

//      this.position[0] += d;
      this.position[0] *= this.side;
      
      this.body  = new p2.Body({
        position: this.position,
        mass:     0.0,
      });

      this.shape = new p2.Convex(this.verts);
      this.body.addShape(this.shape);

      if(this.side == 1) this.body.angle += Math.PI;

      prop.physics.world.addBody(this.body);

    },
    removePhysicsBody: function() {
      prop.physics.world.removeBody(this.body);
    },
    update: function() {

      var paddle = prop.ui.paddles.left;
      if(this.side == 1) paddle = prop.ui.paddles.right;

      this.angle = radians(-10);

      if(paddle == 1) {
        this.angle = radians(20);
      }

      var angle = this.angle_lowpass.filter(this.angle);

      if(this.side == 1) {
        angle = Math.PI - angle;
      }

      this.body.angle = angle;

      this.angle = this.body.angle;
    }
  };
});

function pinball_add_ball(ball) {
  prop.pinball.balls.push(ball);
}

function pinball_init_pre() {
  prop.pinball = {};

  prop.pinball.size = [100, 130];
  prop.pinball.channel = 3;

  prop.pinball.balls = [new Ball({
    position: [0, 65],
  })];

  prop.pinball.obstacles = [];

  prop.pinball.speed = 0.8;

  prop.pinball.path_length = 20;

  prop.pinball.crew = [new Crew({
    ball: prop.pinball.balls[0],
    courage: 0,
    badass: 0
  }), new Crew({
    ball: prop.pinball.balls[0],
    courage: 1,
    badass: 1.5
  }), new Crew({
    ball: prop.pinball.balls[0],
    courage: 0.5,
    badass: 0.8
  })];

  prop.pinball.paddles = {};

  prop.pinball.paddles.left  = new Paddle(-1);
  prop.pinball.paddles.right = new Paddle( 1);

}

function pinball_init() {
  for(var i=0;i<10;i++) {
    break;
    pinball_add_obstacle(new Obstacle({
      type: "circle",
      size: random(2, 6),
      position: [random(-35, 35), random(5, 120)],
      attraction: random(50, 300)
    }));
  }

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 2,
    position: [0, 38],
    attraction: 50
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 3,
    position: [25, 50],
    attraction: 300
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 4,
    position: [30, 110],
    attraction: 150
  }));

  var main = pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 4,
    position: [-10, 90],
    attraction: 400
  }));

  var eve = pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 1.2,
    color: "#a4c",
    parent: main,
    distance: 15,
    speed: 0.1,
    along: 0.2,
    attraction: 50
  }));

  var jool = pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 2,
    color: "#5b6",
    parent: main,
    distance: 30,
    speed: 0.03,
    along: 1.2,
    attraction: 100
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 0.8,
    parent: jool,
    distance: 4,
    speed: 0.6,
    along: 3.5,
    attraction: 20
  }));

  for(var i=-3;i<4;i++) {
    pinball_add_obstacle(new Obstacle({
      type: "circle",
      size: 2,
      position: [i * 12, 30 + mod(i, 2) * 5],
      attraction: 20
    }));
  }
}

function pinball_add_obstacle(obstacle) {
  prop.pinball.obstacles.push(obstacle);
  return obstacle;
}

function pinball_update_pre() {

}

function pinball_update_post() {
  for(var i=0;i<prop.pinball.obstacles.length;i++) {
    prop.pinball.obstacles[i].update();
  }

  for(var i=0;i<prop.pinball.crew.length;i++) {
    prop.pinball.crew[i].update();
  }

  for(var i in prop.pinball.paddles) {
    prop.pinball.paddles[i].update();
  }

  var removal = [];
  for(var i=0;i<prop.pinball.balls.length;i++) {
    var ball = prop.pinball.balls[i];

    if(ball.position[1] < -10) {
      removal.push(i);
    }
  }
    
  for(var i=0;i<removal.length;i++) {
    prop.pinball.balls.splice(removal[i] - i, 1);
  }

}

function pinball_pupdate_pre() {
  for(var i=0;i<prop.pinball.balls.length;i++) {
    prop.pinball.balls[i].update_pre();
  }
}

function pinball_pupdate_post() {
  for(var i=0;i<prop.pinball.balls.length;i++) {
    prop.pinball.balls[i].update_post();
  }
}

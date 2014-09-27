
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

      this.fear_lowpass.filter(force * 0.02 + velocity * 0.01 - 0.3);
      this.shakiness = velocity * 0.01 * (1-this.badass * 0.5);

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

      this.lifetime = options.lifetime || 0.5;

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
      this.size     = options.size || 0.5;
      this.mass     = options.mass || 1.0;

      this.path     = [];

      this.addPhysicsBody();
    },
    addPhysicsBody: function() {
      this.body  = new p2.Body({
        position: this.position,
        mass:     1.0,
      });
      this.shape = new p2.Circle(this.size * 2);
      this.body.addShape(this.shape);

      prop.physics.world.addBody(this.body);

//      this.body.velocity[1] = 50;
//      this.body.velocity[0] = -20;
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

        if(distance < (this.size + obstacle.size) + 0.2) {
          obstacle.addHit(new Hit({
            hitter: this,
            position: obstacle.position,
            speed: distance2d([0, 0], this.body.velocity),
            force: pull,
          }));
          pull *= -15;
          pull = Math.max(-5000, pull);
        }

        var direction = Math.atan2((obstacle.position[0] - this.position[0]),
                                   (obstacle.position[1] - this.position[1]));
        
        var f         = [pull * Math.sin(direction), pull * Math.cos(direction)];
        force[0] += f[0];
        force[1] += f[1];

      }

      this.body.force[0] = force[0];
      this.body.force[1] = force[1];

      var f = distance2d([0, 0], force);
//      prop.pinball.speed = crange(500, f, 1000, 1, 0.8);

    },
    update_post: function() {

      this.body.position[0] = Math.max(this.body.position[0], -prop.pinball.size[0] / 2 + this.size);
      this.body.position[0] = Math.min(this.body.position[0],  prop.pinball.size[0] / 2 - this.size);

      this.body.position[1] = Math.max(this.body.position[1], this.size);
      this.body.position[1] = Math.min(this.body.position[1], prop.pinball.size[1] - this.size);

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

function pinball_init_pre() {
  prop.pinball = {};

  prop.pinball.size = [100, 130];

  prop.pinball.balls = [new Ball({
    position: [35, 110],
    mass: 300,
    size: 0.5
  })];

  prop.pinball.obstacles = [];

  prop.pinball.speed = 1;

  prop.pinball.path_length = 40;

  prop.pinball.crew = [new Crew({
    ball: prop.pinball.balls[0],
    badass: 0
  }), new Crew({
    ball: prop.pinball.balls[0],
    badass: 1
  })];

}

function pinball_init() {
  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 2,
    position: [0, 38],
    attraction: 50
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 3,
    position: [20, 60],
    attraction: 300
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 4,
    position: [-10, 100],
    attraction: 150
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 4,
    position: [10, 90],
    attraction: 50
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 2,
    position: [-30, 60],
    attraction: 200
  }));

  for(var i=-3;i<4;i++) {
    pinball_add_obstacle(new Obstacle({
      type: "circle",
      size: 3,
      position: [i * 12, 20 + mod(i, 2) * 5],
      attraction: 50
    }));
  }
}

function pinball_add_obstacle(obstacle) {
  prop.pinball.obstacles.push(obstacle);
}

function pinball_update_pre() {
  prop.pinball.speed = 1;
}

function pinball_update_post() {
  for(var i=0;i<prop.pinball.obstacles.length;i++) {
    prop.pinball.obstacles[i].update();
  }

  for(var i=0;i<prop.pinball.crew.length;i++) {
    prop.pinball.crew[i].update();
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

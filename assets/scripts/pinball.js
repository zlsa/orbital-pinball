
var Obstacle = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options = {};

      this.type       = options.type || "circle";
                      
      this.position   = options.position || [0, 0];
      this.size       = options.size || 1;
      this.attraction = options.attraction || 0;

      this.addPhysicsShape();
    },
    addPhysicsShape: function() {
      this.shape = new p2.Circle(this.size * 2);
      prop.physics.obstacles.addShape(this.shape, this.position);
    },
    removePhysicsShape: function() {
      prop.physics.obstacles.removeShape(this.shape);
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
        var pull      = (obstacle.attraction * this.mass) / (distance * distance);

        pull  = Math.min(100, pull);
        if(distance < (this.size + obstacle.size) * 2 + 0.05)
          pull *= -50;

        var direction = Math.atan2((obstacle.position[0] - this.position[0]),
                                   (obstacle.position[1] - this.position[1]));
        
        var f         = [pull * Math.sin(direction), pull * Math.cos(direction)];
        force[0] += f[0];
        force[1] += f[1];
      }

      this.body.force[0] = force[0];
      this.body.force[1] = force[1];

//      prop.pinball.speed = crange(20, distance2d(force, [0, 0]), 80, 1, 0.1);

    },
    update_post: function() {
      this.position[0] = this.body.position[0];
      this.position[1] = this.body.position[1];

      if(this.path.length >= 1 && distance2d(this.position, this.path[this.path.length-1]) < 0.7) return;
      this.path.push([this.position[0], this.position[1]]);
      if(this.path.length > 500) {
        this.path.splice(0, this.path.length - 500);
      }
    },
  };
});

function pinball_init_pre() {
  prop.pinball = {};

  prop.pinball.size = [80, 120];

  prop.pinball.ball = new Ball({
    position: [35, 110],
    mass: 200,
    size: 0.5
  });

  prop.pinball.obstacles = [];

  prop.pinball.speed = 0.5;
}

function pinball_init() {
  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 0.8,
    position: [1, 15],
    attraction: 50
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 1.5,
    position: [5, 40],
    attraction: 100
  }));

  pinball_add_obstacle(new Obstacle({
    type: "circle",
    size: 2,
    position: [-30, 100],
    attraction: 150
  }));
}

function pinball_add_obstacle(obstacle) {
  prop.pinball.obstacles.push(obstacle);
}

function pinball_pupdate_pre() {
  prop.pinball.ball.update_pre();
}

function pinball_pupdate_post() {
  prop.pinball.ball.update_post();
}

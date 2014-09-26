
function physics_init_pre() {
  prop.physics = {};

  prop.physics.world = new p2.World({
    gravity: [0, -15],
    broadphase: new p2.SAPBroadphase()
  });

  prop.physics.steps = 2;

  var mat = new p2.Material();

  prop.physics.world.defaultMaterial = mat;

  prop.physics.world.defaultContactMaterial = new p2.ContactMaterial(mat, mat, {
    restitution: 0.5,
  });

  prop.physics.obstacles = new p2.Body({
    mass: 0,
    position: [0, 0]
  });
  prop.physics.world.addBody(prop.physics.obstacles);

  prop.physics.border = new p2.Body({
    mass: 0,
    position: [0, 0]
  });
  prop.physics.world.addBody(prop.physics.border);
}

function physics_init() {

  var width  = prop.pinball.size[0];
  var height = prop.pinball.size[1];

  var border = 200;

  prop.physics.border.addShape(new p2.Rectangle(border, height), [ (width + border) / 2, height / 2]);
  prop.physics.border.addShape(new p2.Rectangle(border, height), [-(width + border) / 2, height / 2]);

  prop.physics.border.addShape(new p2.Rectangle(width + border * 2,  border), [0,                    -border / 2]);
  prop.physics.border.addShape(new p2.Rectangle(width + border * 2,  border), [0,                     height + border / 2]);

}

function physics_update() {

  for(var i=0;i<prop.physics.steps;i++) {
    pinball_pupdate_pre();
    prop.physics.world.step(physics_delta() * prop.pinball.speed);
    pinball_pupdate_post();
  }

}

function physics_delta() {
  return delta() / prop.physics.steps;
}

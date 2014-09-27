
function physics_init_pre() {
  prop.physics = {};

  prop.physics.world = new p2.World({
    gravity: [0, -30],
    broadphase: new p2.SAPBroadphase()
  });

  prop.physics.steps = 4;

  var mat = new p2.Material();

  prop.physics.world.defaultMaterial = mat;

  prop.physics.world.defaultContactMaterial = new p2.ContactMaterial(mat, mat, {
    restitution: 0.8,
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

  prop.physics.border.addShape(new p2.Rectangle(width + border * 2,  border), [0,                     height + border / 2]);

  prop.physics.corners = [];

  var c = {};
  c.size   = [ width * 0.4, height * 0.2];
  c.offset = [-width * 0.5, 0];
  c.vertices = [
    [prop.pinball.channel, prop.pinball.channel * 4],
    [c.size[0], prop.pinball.channel * 3],
    [prop.pinball.channel, c.size[1] + prop.pinball.channel * 3],
  ];
  prop.physics.corners.push(c);

  c = {};
  c.size   = [ width * 0.4, height * 0.2];
  c.offset = [-width * 0.5, 0];
  c.vertices = [
    [0, prop.pinball.channel * 3],
    [0, 0],
    [c.size[0], 0],
    [c.size[0], prop.pinball.channel * 2],
  ];
  prop.physics.corners.push(c);

  for(var j=0;j<prop.physics.corners.length;j++) {
    var c = prop.physics.corners[j];

    var vs = [];

    for(var i=0;i<c.vertices.length;i++) {
      var v = c.vertices[i];
      vs.push([v[0], v[1]]);
    }
    prop.physics.border.addShape(new p2.Convex(vs), [c.offset[0], c.offset[1]]);

    vs = [];
    for(var i=c.vertices.length-1;i>=0;i--) {
      var v = c.vertices[i];
      vs.push([-v[0], v[1]]);
    }
    prop.physics.border.addShape(new p2.Convex(vs), [-c.offset[0], c.offset[1]]);
  }
  
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

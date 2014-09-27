
function canvas_init_pre() {
  prop.canvas={};

  prop.canvas.contexts={};

  // resize canvas to fit window?
  prop.canvas.resize=false;

  prop.canvas.size={ // all canvases are the same size
    width:  m(prop.pinball.size[0]),
    height: m(prop.pinball.size[1]),
  };
}

function canvas_init() {
  canvas_add("obstacles");
  canvas_add("ball");
  canvas_add("crew");
}

function canvas_resize() {
  if(prop.canvas.resize) {
    prop.canvas.size.height=$(window).height();
    prop.canvas.size.width=$(window).width();
  }

  for(var i in prop.canvas.contexts) {
    prop.canvas.contexts[i].canvas.width  = prop.canvas.size.width;
    prop.canvas.contexts[i].canvas.height = prop.canvas.size.height;
  }

  $("#canvases").width(prop.canvas.size.width);
  $("#canvases").height(prop.canvas.size.height);
  $("#canvases").offset({top: ($(window).height() - prop.canvas.size.height) / 2});
  $("#canvases").css("opacity", "1");

  $("#crew-canvas").get(0).width  = prop.pinball.crew.length * prop.style.crew.size[0];
  $("#crew-canvas").get(0).height = prop.style.crew.size[1];

  prop.canvas.obstacles = false;
}

function canvas_add(name) {
  if(name == "crew") {
    $("body").append("<canvas id='"+name+"-canvas'></canvas>");
  } else {
    $("#canvases").append("<canvas id='"+name+"-canvas'></canvas>");
  }
  prop.canvas.contexts[name]=$("#"+name+"-canvas").get(0).getContext("2d");
}

function canvas_get(name) {
  return(prop.canvas.contexts[name]);
}

function canvas_clear(cc) {
  cc.clearRect(0,0,prop.canvas.size.width,prop.canvas.size.height);
}

function m(n) {
  return n * 5;
}

function canvas_draw_hit(cc, hit, obstacle) {
  if(hit.isDead()) return;
  var age    = hit.getAge();
  var radius = crange(0, age, hit.lifetime, m(obstacle.size * 2 + 0.0), m(obstacle.size * 6 + (hit.force * 0.001)));

  var alpha = crange(0, age, hit.lifetime, crange(80, hit.speed, 150, 0.1, 1.0), 0);
  cc.fillStyle = "transparent";
  cc.fillStyle = "rgba(255, 255, 255, " + alpha + ")";

  cc.beginPath();
  cc.arc(m(hit.position[0]), m(hit.position[1]), radius, 0, Math.PI*2);
  cc.fill();

}

function canvas_draw_obstacle(cc, obstacle) {
//  var opacity = crange(10, obstacle.attraction, 200, 0.5, 0);
//  obstacle.color.setOpacity(opacity);
  cc.fillStyle = obstacle.color.getCssValue();

  cc.beginPath();
  cc.arc(m(obstacle.position[0]), m(obstacle.position[1]), m(obstacle.size), 0, Math.PI*2);
  cc.fill();

  var alpha = crange(10, obstacle.attraction, 200, 0.15, 0.3);
  cc.strokeStyle = "rgba(255, 255, 255, " + alpha + ")";
  cc.lineWidth   = crange(10, obstacle.attraction, 200, 0.5, 1.0);

  var ring = obstacle.soi + obstacle.size;

  cc.beginPath();
  cc.arc(m(obstacle.position[0]), m(obstacle.position[1]), m(ring), 0, Math.PI*2);
  cc.stroke();

  if(obstacle.parent && false) {
    cc.strokeStyle = "rgba(64, 191, 255, 0.2)";
    cc.beginPath();
    cc.arc(m(obstacle.parent.position[0]), m(obstacle.parent.position[1]), m(obstacle.distance), 0, Math.PI*2);
    cc.lineWidth=2;
    cc.stroke();
  }

}

function canvas_draw_obstacles(cc) {
  for(var i=0;i<prop.pinball.obstacles.length;i++) {
    canvas_draw_obstacle(cc, prop.pinball.obstacles[i]);
  }
}

function canvas_draw_border(cc) {
  cc.fillStyle="#888";

  for(var i=0;i<prop.physics.corners.length;i++) {
    var c = prop.physics.corners[i];

    cc.save();

    cc.beginPath();

    cc.translate(m(c.offset[0]),      m(c.offset[1]));
    cc.moveTo(   m(c.vertices[0][0]), m(c.vertices[0][1]));
    for(var j=1;j<c.vertices.length;j++){
      cc.lineTo(m(c.vertices[j][0]), m(c.vertices[j][1]));
    }

    cc.translate(-m(c.offset[0]), -m(c.offset[1]));
    cc.scale(-1, 1);
    cc.translate(m(c.offset[0]), m(c.offset[1]));
    cc.moveTo(   m(c.vertices[0][0]), m(c.vertices[0][1]));
    for(var j=1;j<c.vertices.length;j++){
      cc.lineTo(m(c.vertices[j][0]), m(c.vertices[j][1]));
    }

    cc.fill();

    cc.restore();
  }

}

function canvas_draw_ball(cc, ball) {
  cc.lineJoin    = "round";
  cc.lineCap     = "round";
  cc.lineWidth   = 2;

  cc.strokeStyle = "#38f";

  if(ball.path.length >= 2) {
    //    cc.moveTo(m(ball.path[0][0]), m(ball.path[0][1]));
    var fade_start = 10;
    var fade_end   = prop.pinball.path_length;
    for(var i=Math.max(1, ball.path.length - fade_end);i<ball.path.length;i++) {
      cc.beginPath();
      cc.lineWidth=crange(fade_end, Math.max(0, (ball.path.length - i)) - 1, 0, 0, m(ball.size));
      cc.moveTo(m(ball.path[i-1][0]), m(ball.path[i-1][1]));
      cc.lineTo(m(ball.path[i  ][0]), m(ball.path[i  ][1]));
      cc.stroke();
    }
  }

  cc.fillStyle = "#000";

  cc.beginPath();
  cc.arc(m(ball.position[0]), m(ball.position[1]), m(ball.size) + 1, 0, Math.PI*2);
  cc.fill();

  cc.fillStyle = "#aaa";

  cc.beginPath();
  cc.arc(m(ball.position[0]), m(ball.position[1]), m(ball.size), 0, Math.PI*2);
  cc.fill();

  cc.fillStyle = "#444";

  cc.beginPath();
  cc.arc(m(ball.position[0]), m(ball.position[1]), m(ball.size * 0.6), 0, Math.PI*2);
  cc.fill();

  cc.fillStyle = "#d75";

  cc.beginPath();
  cc.arc(m(ball.position[0]), m(ball.position[1]), m(ball.size * 0.3), 0, Math.PI*2);
  cc.fill();

}

function canvas_draw_crew(cc, crew) {
  var width  = prop.style.crew.size[0];
  var height = prop.style.crew.size[1];
  var horizontal_backdrop_distance = 8;
  var vertical_backdrop_distance = 10;

  var head_width  = prop.style.crew.head.size[0];
  var head_height = prop.style.crew.head.size[1];
  var head_curve  = prop.style.crew.head.curve;

  cc.fillStyle = "#666";
  cc.fillRect(0, 0, width, height);

  var amp  = trange(0, crew.shakiness, 1, 0, 3);
  var freq = trange(0, crew.shakiness, 1, 1, 3);

  var hbd = horizontal_backdrop_distance;
  var vbd = vertical_backdrop_distance;

  var seed = fl(crew.seed * 100);

  // cabin
  cc.save();
  cc.translate(sr(seed + 842, freq * 0.2) * amp * 0.5, sr(seed + 498, freq * 0.2) * amp * 0.5);
  cc.translate(width/2, height/2);
  cc.rotate(sr(seed + 982, freq) * amp * 0.03);
  cc.translate(-width/2, -height/2);

  cc.fillStyle = "#444";

  cc.beginPath();
  cc.moveTo(-hbd, -vbd);
  cc.lineTo(width+hbd, -vbd);
  cc.lineTo(width-hbd, vbd);
  cc.lineTo(hbd, vbd);
  cc.fill();

  cc.fillStyle = "#777";

  cc.beginPath();
  cc.moveTo(-hbd, -vbd);
  cc.lineTo(-hbd, height + vbd);
  cc.lineTo(hbd, height + vbd);
  cc.lineTo(hbd, vbd);
  cc.fill();

  cc.fillStyle = "#555";

  cc.beginPath();
  cc.moveTo(width+hbd, -vbd);
  cc.lineTo(width, height + vbd);
  cc.lineTo(width-hbd, height + vbd);
  cc.lineTo(width-hbd, vbd);
  cc.fill();

  // kerbal
  cc.save();
  cc.fillStyle = "#bada55";

  var hw = head_width / 2;
  var hh = head_height / 2;
  var hc = head_curve / 2;

  cc.translate(width/2, height/2 + 4);

  cc.translate(sr(seed + 982, freq) * amp, sr(seed + 298, freq) * amp);

  cc.translate(0, hh);
  cc.rotate(sr(seed + 258, freq) * amp * 0.015);
  cc.translate(0, -hh);

  cc.beginPath();
  cc.moveTo(-hw, -hh+hc);
  cc.bezierCurveTo(-hw, -hh, hw, -hh, hw, -hh+hc);
  cc.lineTo(hw, hh-hc);
  cc.bezierCurveTo(hw, hh, -hw, hh, -hw, hh-hc);
  
  var nw = prop.style.crew.head.neck_width / 2;
  cc.moveTo(-nw, 0);
  cc.lineTo( nw, 0);
  cc.lineTo( nw, 100);
  cc.lineTo(-nw, 100);
  cc.fill();

  cc.fillStyle="rgba(0, 0, 0, 0.4)";
  
  var hair_height = prop.style.crew.head.hair_height;

  cc.beginPath();
  cc.moveTo(-hw, -hh+hc);
  cc.bezierCurveTo(-hw, -hh, hw, -hh, hw, -hh+hc);
  cc.lineTo(hw, -hh+hair_height);
  cc.quadraticCurveTo(0, -hh+hair_height, 0, -hh+hair_height * 1.5);
  cc.quadraticCurveTo(0, -hh+hair_height, -hw, -hh+hair_height);
  cc.lineTo(-hw, -hh+hair_height);
  
  cc.fill();

  var ed  = prop.style.crew.head.eye.distance / 2;
  var es  = prop.style.crew.head.eye.size + crange(0, crew.fear, 1, 0, 5);
  var eps = prop.style.crew.head.eye.pupil * crange(-1, crew.fear, 1, 1.4, 0.8);
  var eh  = prop.style.crew.head.eye.offset;

  var f = crange(-1, crew.fear, 1, 1.5, 0.2);
  var ep = [
    sr(seed + 22, 2) * es * 0.4 * f,
    sr(seed + 42, 2) * es * 0.4 * f
  ];

  for(var i=0;i<2;i++) {
    var d = -1;
    if(i == 1) d = 1;

    cc.save();
    cc.translate(ed * d, 0);

    cc.fillStyle = "#fff";
    cc.beginPath()
    cc.arc(0, eh, es/2, 0, Math.PI*2);
    cc.fill();

    cc.fillStyle = "#111";
    cc.beginPath()
    cc.arc(0 + ep[0], eh + ep[1], eps/2, 0, Math.PI*2);
    cc.fill();
    cc.restore();
  }
  
  // mouth

  var mouth_open = crange(0.2, Math.abs(crew.fear), 2, prop.style.crew.mouth.open, prop.style.crew.mouth.fear.open);
  var mouth_curve = crew.fear * prop.style.crew.mouth.fear.curve * 0.3;

  var mc = mouth_curve;
  var mh = mouth_open / 2 + (Math.abs(sr(84 + seed, 1) * 5));
  var mw = prop.style.crew.mouth.width / 2 - mh;
  var mo = prop.style.crew.mouth.offset - mc;

  mh *= crange(-1, crew.fear, 0, 1.5, 1);

  mw *= crange(0.2, Math.abs(crew.fear), 2, 0.6, 0.9);

  cc.save();
  cc.translate(0, mo);
  cc.strokeStyle="#c21";
  cc.lineCap="round";
  cc.lineWidth = mh;
  cc.beginPath();
  cc.moveTo(-mw, mc);
  cc.quadraticCurveTo(0, 0, mw, mc);
  cc.stroke();

  cc.restore();
  
  cc.restore();
  cc.restore();

}

function canvas_draw_paddle(cc, paddle) {
  cc.save();
  cc.translate(m(paddle.position[0]), m(paddle.position[1]));
  cc.rotate(paddle.angle);
  cc.beginPath();

  cc.moveTo(m(paddle.verts[0][0]), m(paddle.verts[0][1]));
  for(var i=1;i<paddle.verts.length;i++) {
    cc.lineTo(m(paddle.verts[i][0]), m(paddle.verts[i][1]));
  }
  cc.closePath();
  
  cc.strokeStyle = "#000";
  cc.lineWidth = 2;
  cc.stroke();

  cc.fillStyle = "#bbb";
  cc.fill();

  cc.beginPath();
  cc.fillStyle = "#d72";
  cc.arc(0, 0, m(0.5), 0, Math.PI*2);
  cc.fill();

  cc.restore();
}

function canvas_update_post() {
  if(!prop.canvas.obstacles) {
    var cc=canvas_get("obstacles");
    cc.save();
    canvas_clear(cc);

    cc.translate(prop.canvas.size.width / 2,  prop.canvas.size.height / 2);
    cc.scale(1.0, -1.0);
    cc.translate(0,                          -prop.canvas.size.height / 2);

    canvas_draw_obstacles(cc);
    canvas_draw_border(cc);

    canvas_draw_paddle(cc, prop.pinball.paddles.left);
    canvas_draw_paddle(cc, prop.pinball.paddles.right);

    cc.restore();
  }

  var cc=canvas_get("ball");
  cc.save();
  canvas_clear(cc);

  cc.translate(prop.canvas.size.width / 2,  prop.canvas.size.height / 2);
  cc.scale(1.0, -1.0);
  cc.translate(0,                          -prop.canvas.size.height / 2);

  for(var i=0;i<prop.pinball.balls.length;i++) {
    canvas_draw_ball(cc, prop.pinball.balls[i]);
  }

  for(var i=0;i<prop.pinball.obstacles.length;i++) {
    for(var j=0;j<prop.pinball.obstacles[i].hits.length;j++){
      canvas_draw_hit(cc, prop.pinball.obstacles[i].hits[j], prop.pinball.obstacles[i]);
    }
  }

  cc.restore();

  return;

  cc=canvas_get("crew");
  cc.save();
  canvas_clear(cc);

  for(var i=0;i<prop.pinball.crew.length;i++) {
    cc.save();

    cc.translate(prop.style.crew.size[0] * i, 0);

    var w = prop.style.crew.size[0];
    var h = prop.style.crew.size[1];

    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(w, 0);
    cc.lineTo(w, h);
    cc.lineTo(0, h);
    cc.clip()
    canvas_draw_crew(cc, prop.pinball.crew[i]);
    cc.restore();
  }

  cc.restore();

  prop.canvas.obstacles = false;
}

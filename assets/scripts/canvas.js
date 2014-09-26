
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
}

function canvas_add(name) {
  $("#canvases").append("<canvas id='"+name+"-canvas'></canvas>");
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

function canvas_draw_obstacle(cc, obstacle) {
  cc.fillStyle = "#fff";

  cc.beginPath();
  cc.arc(m(obstacle.position[0]), m(obstacle.position[1]), m(obstacle.size * 2), 0, Math.PI*2);
  cc.fill();
}

function canvas_draw_obstacles(cc) {
  for(var i=0;i<prop.pinball.obstacles.length;i++) {
    canvas_draw_obstacle(cc, prop.pinball.obstacles[i]);
  }
}

function canvas_draw_ball(cc, ball) {
  cc.lineJoin    = "round";
  cc.lineCap     = "round";
  cc.lineWidth   = 2;

  if(ball.path.length >= 2) {
    //    cc.moveTo(m(ball.path[0][0]), m(ball.path[0][1]));
    var fade_start = 100;
    var fade_end   = 200;
    for(var i=Math.max(1, ball.path.length - fade_end);i<ball.path.length;i++) {
      cc.beginPath();
      var alpha = crange(fade_end, Math.max(0, (ball.path.length - i)), fade_start, 0, 255);
      cc.strokeStyle = "rgb(" + fl(alpha * 0.3) + ", " + fl(alpha * 0.6) + ", " + fl(alpha) + ")";
      cc.moveTo(m(ball.path[i-1][0]), m(ball.path[i-1][1]));
      cc.lineTo(m(ball.path[i  ][0]), m(ball.path[i  ][1]));
      cc.stroke();
    }
    cc.globalAlpha = 1;
  }

  cc.fillStyle = "#bada55";

  cc.beginPath();
  cc.arc(m(ball.position[0]), m(ball.position[1]), m(ball.size * 2), 0, Math.PI*2);
  cc.fill();

}

function canvas_update_post() {
  var cc=canvas_get("obstacles");
  cc.save();
  canvas_clear(cc);

  cc.translate(prop.canvas.size.width / 2,  prop.canvas.size.height / 2);
  cc.scale(1.0, -1.0);
  cc.translate(0,                          -prop.canvas.size.height / 2);

  canvas_draw_obstacles(cc);
  canvas_draw_ball(cc, prop.pinball.ball);

  cc.restore();
}


function ui_init_pre() {

}

function ui_init() {
  $("#canvases").click(function(e) {
    var offset = $("#canvases").offset();
    var w = prop.pinball.size[0];
    var h = prop.pinball.size[1];

    var x = crange(offset.left, e.pageX, offset.left + $("#canvases").width(), -w/2, w/2);
    var y = crange(offset.top, e.pageY, offset.top + $("#canvases").height(), h, 0);

    if(x < -w/2 || x > w/2) return;
    if(y < 0 || y > h) return;

    pinball_add_ball(new Ball({
      position: [x, y],
    }));
  });
}

var building_div = document.createElement('div');
var UNIT = 64;
var REPS = 5;
var t = new Date().getTime();
building_div.style.width = UNIT + 'px';
building_div.style.height =  (REPS * UNIT) + 'px';
building_div.id = 'building-canvas';

document.body.appendChild(building_div);

building_div.style.position = 'absolute';
//building_div.style.display='none';

var engine = Partition.engines.canvas('#building-canvas');

var ROWS = REPS * 20;
var COLS = 18;
var slice = new Partition.Slice('draw by type',
    {rows: ROWS, columns: COLS},
    engine.element, engine).setDrawType('grid');

slice.processCell = function (inner, column, row) {
    inner.setDrawType('rect');
    var is_border_col = column == 0 || column == COLS - 1;
    var is_unwindowed_row = !(row % 2);
    var is_window_col = !(column % 2);
    if (is_unwindowed_row) {
        inner.setColor(225, 225, 225);// wall
        if (is_border_col) {
        } else {
            inner.child('ledge_shadow').setHeight('10%').setColor(255, 255, 255).setAnchor('T'); // highlight
            inner.child('ledge_shadow').setHeight('15%').setColor(160,160,166).setAnchor('B'); // shadow
        }
    } else if (is_border_col) {
        inner.setColor(225, 255, 225);// wall
    } else if (is_window_col) {
        inner.setColor(255,255,255); // window
    } else {
        inner.setColor(205, 205, 210);// wall, between windows
        inner.child('under ledge').setHeight('20%').setAnchor('T').setColor(190,190,195);
    }
};

slice.draw();
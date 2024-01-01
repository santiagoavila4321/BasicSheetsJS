
var tabla=new SheetsTable({
    element:document.getElementById('TablaSheet'),
    opcions:{
        addcolumns:false,
        columns:100,
        rows:100
    }
});
if(tabla){
    // tabla.Rows[1][3].classList.add('select');
    // tabla.Rows[1][3].style.setProperty('--selec-type-with',(tabla.Rows[1][3].getBoundingClientRect().width-1)+'px');
    // tabla.Rows[1][3].style.setProperty('--selec-type-height',(tabla.Rows[1][3].getBoundingClientRect().height-1)+'px');
    // tabla.Rows[1][3].style.setProperty('--selec-type-top',(tabla.Rows[1][3].getBoundingClientRect().y- 2 - tabla.table.getBoundingClientRect().y)+'px');
    // tabla.Rows[1][3].style.setProperty('--selec-type-left',(tabla.Rows[1][3].getBoundingClientRect().x- 2 - tabla.table.getBoundingClientRect().x)+'px');
}

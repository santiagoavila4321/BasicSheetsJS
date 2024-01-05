
var tabla=new SheetsTable({
    element:document.getElementById('TablaSheet'),
    opcions:{
        addcolumns:true,
        columns:5,
        rows:10,
    }
});

tabla.Cells('C5').widgets.data={type: 'List', value: 1,list:["Santi","Nico","Angelica","Daniela",123.2222222]};

tabla.Cells('D5').value='=List([A1,444,B2,"Hola"])';

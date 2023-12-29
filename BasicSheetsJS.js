class TableSheets{
    constructor(element,opcions=undefined,data=null){
        //Creador de elementos
        this.table=document.createElement('table');
        this.table.className='table-object-sheets';
        this._select_object={'element':document.createElement('div')};
        this.element=document.createElement('div');
        this.element.className='table-conten-sheets';
        this.table.appendChild(document.createElement('thead'));
        this.table.appendChild(document.createElement('tbody'));

        //Opciones de tabla
        // this.opcions={
        //     rows:1,
        //     addrows:true,
        //     addcolumns:true,
        //     maxrow:1000,
        //     maxcolums:100,
        //     fonsize:13,
        //     colorprimario:'rgb(0, 217, 255)',
        //     maxprivius:5
        // };
        this.opcions={};
        Object.defineProperties(this.opcions,{
            _config:{
                value:[{'name':'A','modific':true},{'name':'B','modific':true},{'name':'C','modific':true}]
            },
            columns:{
                get:function() { return this._config;},
                set:function(){
                    console.log('hola');
                },
                enumerable: true,
            }
        });
        // [
        //     {'name':'A','modific':true},
        //     {'name':'B','modific':true},
        //     {'name':'C','modific':true}
        // ]
    }

    get TableHead(){
        return this.table.tHead;
    }

    get TableBody(){
        return this.table.tBodies[0];
    }
}

class SheetsColumns extends Array{
    constructor({TableSheets}){
        super();
        this.TableSheets=TableSheets;
    }
}

class SheetsColum extends HTMLTableCellElement{
    constructor(){
        super();
        this.Nombre='hola';
        this.className='table-colum-sheets';
    }
}
customElements.define('sheets-colum', SheetsColum, { extends: 'td' });
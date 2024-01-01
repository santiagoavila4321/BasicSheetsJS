class SheetsTable{
    _mousemove=false;
    constructor({element,opcions={},data=null}){
        //Creador de elementos
        this.element=document.createElement('div');
        this.element.className='table-conten-sheets';
        this.table=document.createElement('table');
        this.table.className='table-object-sheets';
        this.table.appendChild(document.createElement('thead'));
        this.table.appendChild(document.createElement('tbody'));
        this.TableHead.appendChild(document.createElement('td'));
        this.element.appendChild(this.table);

        //Defino comportamiento de algunas propiedades
        Object.defineProperties(this,{
            //Crear El objeto Columnas
            Columns:{
                value:new SheetsColumns({sheetstable:this}),
                enumerable: true
            },
            //Crear El objeto filas
            Rows:{
                value:new SheetsRows({sheetstable:this})
            }
        });

        Object.defineProperties(this,{
            //Defino las opciones
            opcions:{
                value: new SheetsOpcions(Object.assign({sheetstable:this},opcions)),
                enumerable: true
            }
        });

        //Defino variables
        this.cellselect=undefined;
        this.cellselect2=undefined;
        this.cellselects=[];


        //asigno eventos
        this
        this.TableBody.addEventListener('mousemove',this.#mousemovetable.bind(this))

        //Asignamos al elmento madre
        element.appendChild(this.element);
    }

    get TableHead(){
        return this.table.tHead;
    }

    get TableBody(){
        return this.table.tBodies[0];
    }

    deteColum(index){
        if(!this.opcions.addColum){
            return false;
        }

        this.Columns.splice(index,1);
        this.Rows.forEach(row=>{
            row.splice(index,1);
        });
    }

    addColum(index){
        if(!this.opcions.addColum){
            return false;
        }

        this.Columns.splice(index,0,new SheetsColum({}));
        this.Rows.forEach(row=>{
            row.splice(index,0,new SheetsCell({}));
        });
    }

    deteRow(index){
        if(!this.opcions.addRow){
            return false;
        }

        this.Rows.splice(index,1);
    }

    addRow(index){
        if(!this.opcions.addRow){
            return false;
        }

        this.Rows.splice(index,0,new SheetsRow({}));
        this.Columns.forEach(Columna=>{
            this.Rows[index].push(new SheetsCell({}));
        });
    }

    _DeselecionarCells(cellselect=true){
        this.cellselects.forEach(Cell=>{
            if(this.cellselect){
                if(!(this.cellselect==Cell)|| cellselect){
                    Cell.select=false;
                }
            }
        });
        this.cellselects=[];
        if(!cellselect){
            this.cellselects.push(this.cellselect);
        }
    }

    #selecs_cels(cell1,cell2){
        let cellselects=[];
        if(cell1.row<cell2.row){
            if(cell1.colum<cell2.colum){
                cellselects=this.#blucle_selct(cell1.row,cell2.row,cell1.colum,cell2.colum);
            }else{
                cellselects=this.#blucle_selct(cell1.row,cell2.row,cell2.colum,cell1.colum);
            }
        }else{
            if(cell1.colum<cell2.colum){
                cellselects=this.#blucle_selct(cell2.row,cell1.row,cell1.colum,cell2.colum);
            }else{
                cellselects=this.#blucle_selct(cell2.row,cell1.row,cell2.colum,cell1.colum);
            }
        }
        return cellselects;
    }

    #blucle_selct(a,b,c,d){
        let cellselects=[];
        for(let i=a;i<=b;i++){
            for(let j=c;j<=d;j++){
                this.Rows[i][j].select=true;
                cellselects.push(this.Rows[i][j]);
            }
        }
        return cellselects;
    }

    #mousemovetable(event){
        if(!this._mousemove){
            return null;
        }

        if(this.cellselect){
            this.#mousemovecellselect(event);
        }
    }

    #mousemovecellselect(event){
        let celda=check_mouse_element(event,SheetsCell);
        if(celda!=this.cellselect && celda){
            this.cellselect.select=true;
            this._DeselecionarCells(false);
            this.cellselects=this.#selecs_cels(this.cellselect,celda);
            if(this.cellselects.length>0){
                this.cellselect.UpdateStylePropertys(this.cellselects[0],this.cellselects[this.cellselects.length-1]);
            }
        }
    }
}

class SheetsArrayElements extends Array{
    constructor({sheetstable=null,Element=null,ItemType=null}){
        super();
        this.Element=Element;
        this.ItemType=ItemType;
        this.sheetstable=sheetstable;

        return new Proxy(this, {
            set: this.#ProxiCallSet.bind(this),
        });
    }

    GetNodeElement(index){
        return this[index];
    }

    UpdateIndexs(start,cambio=0){
        return this.slice(start).map((row,index)=>{row.index=index+cambio+start});
    }

    lengthElement(diferencia=0){
        return this.Element.childElementCount+diferencia;
    }

    UpdateItems(index){
        if(index<this.lengthElement()){
            if(this.length==this.lengthElement()){
                this.DeteElement(index);
                this.InsertBeforeElement(index);
            }
        }else{
            this.AddElement();
        }
    }

    splice(start, deleteitem, item){
        if(!this.Indentificador_de_objecto(item)){
            return undefined;
        }
        if(deleteitem){
            this.DeteElement(start);
        }
        if(item){
            super.splice(start, deleteitem, item);
            this.InsertBeforeElement(start);
            this.ItemIndex(this[start],start);
        }else{
            super.splice(start, deleteitem);
        }
        return this[start];
    }

    clear(){
        const size = this.length;
        for(let i=0;i<size;i++){
            this.pop();
        }
    }

    pop(){
        if(this.length>0){
            this.DeteElement(this.length-1);
        }
        return super.pop();
    }

    DeteElement(index){
        this.Element.childNodes[index].remove();
    }

    InsertBeforeElement(index){
        this.Element.insertBefore(this.GetNodeElement(index),this.GetNodeElement(index+1));
    }

    AddElement(){
        this.Element.appendChild(this.GetNodeElement(this.length-1));
    }

    Indentificador_de_objecto(Item){
        if(!(Item instanceof this.ItemType) && Item!==undefined){
            console.error('El objeto '+Item+' no es una instacia valida');
            return false;
        }
        return true;
    }

    //Modifica el valor de index del item
    ItemIndex(item,valor){
        item.sheetstable=this.sheetstable;
    }

    #ProxiCallSet(target, prop, value){
        //identifica que el operador seal el indice
        if(!isNaN(parseInt(prop))){
            if(!this.Indentificador_de_objecto(value)){
                return true;
            }
        }
        target[prop] = value;

        //de ser una modificacion del objeto en el arreglo
        if(!isNaN(parseInt(prop))){
            if(value){
                this.ItemIndex(this[prop],parseInt(prop));
            }
            this.UpdateItems(parseInt(prop));
        }
        return true;
    }
}

class SheetsColumns extends SheetsArrayElements{
    constructor({sheetstable=null}){
        super({
            sheetstable:sheetstable,
            Element:sheetstable? sheetstable.TableHead: null,
            ItemType:SheetsColum
        });
    }

    ItemIndex(item,index){
        item.index=index;
        super.ItemIndex(item,index);
    }

    lengthElement(){
        return super.lengthElement(-1);
    }

    DeteElement(index){
        super.DeteElement(index+1);
    }
    
}

class SheetsRow extends SheetsArrayElements{
    constructor({sheetstable=null,index=0}){
        super({
            sheetstable:sheetstable,
            Element: document.createElement('tr'),
            ItemType: SheetsCell
        });
        this.RowIdentificador=document.createElement('td');
        this.Element.appendChild(this.RowIdentificador);
        this.index=index;
    }

    set index(index){
        this.RowIdentificador.innerText=index+1;
        this.forEach(cell=>{
            cell.coordenada=[index,cell.coordenada[1]];
        });
    }

    get index(){
        return parseInt(this.RowIdentificador.innerText);
    }

    ItemIndex(item,index){
        item.coordenada=[this.index-1,index];
        super.ItemIndex(item,index);
    }

    lengthElement(){
        return super.lengthElement(-1);
    }

    DeteElement(index){
        super.DeteElement(index+1);
    }
}

class SheetsRows extends SheetsArrayElements{
    constructor({sheetstable=null}){
        super({
            sheetstable:sheetstable,
            Element: sheetstable? sheetstable.TableBody:null,
            ItemType: SheetsRow
        });
    }

    ItemIndex(item,index){
        item.index=index;
        super.ItemIndex(item,index);
    }

    GetNodeElement(index){
        return this[index].Element;
    }
}

class SheetsColum extends HTMLTableCellElement{
    _index=0;
    constructor({tableSheets=null,columIndex=0,name=null}){
        super();
        this.className='table-colum-sheets';
        this.tableSheets=tableSheets;
        this.name=(name!==null)? name : columnaindex(columIndex);
        this.modific=(name===null);
        this.index=columIndex;
    }

    set index(columIndex){
        if(this.modific){
            this.name=columnaindex(columIndex);
        }
        this._index=columIndex;
    }

    get index(){
        return this._index;
    }

    set name(name){
        this.innerText=name;
    }

    get name(){
        return this.innerText;
    }

    get Cells(){
        return Array.from(this.sheetstable.Rows.map(row=>row[this.index]));
    }

    
}

class SheetsCell extends HTMLTableCellElement{
    constructor({sheetstable=null,row=0,colum=0,val=''}){
        super();
        //DEfino los parametros de tabla 
        this.sheetstable=sheetstable;

        //coordenadas de la celda 
        this.coordenada=[row,colum];
        this.className='table-sheets-celda'; //clase del elemento td

        //this.textconten=document.createElement('div');
        //this.textconten.className='table-sheets-cell-text-conten';
        //this.appendChild(this.textconten);
        if(this.row==2 && this.colum==2){
            this.addEventListener('mousedown',this.#mouse_down_event);
            this.addEventListener('mouseup',this.#mouse_up_event);
        }

        this.input=null;
        //this.DefaultStylePropertys();
        
    }
    set select(selec){
        if(selec){
            if(!this.classList.contains('select')){
                this.classList.add('select');
            }
        }else{
            if(!selec && this.classList.contains('select')){
                this.classList.remove('select');
            }

            this.dataset["activo"]="false";
            this.DefaultStylePropertys();

            if(this.input){
                this.input.remove();
                this.input=null;
            }
        }
    }
    get select(){
        return this.classList.contains('select');
    }

    //se cuando se altere las propiedades de coordenada se modifica el andress y row and colum
    set coordenada(val){
        this.row=val[0];
        this.colum=val[1];
        this.address=columnaindex(val[1])+(val[0]+1);
    }

    get coordenada(){
        return [this.row,this.colum];
    }

    set value(value){
        this.textconten.innerText=value;
    }

    UpdateStylePropertys(Cell1,Cell2){
        this.style.setProperty('--selec-type-with',(Cell2.getBoundingClientRect().x - Cell1.getBoundingClientRect().x + Cell2.getBoundingClientRect().width-1)+'px');
        this.style.setProperty('--selec-type-height',(Cell2.getBoundingClientRect().y - Cell1.getBoundingClientRect().y +  Cell2.getBoundingClientRect().height-1)+'px');
        this.style.setProperty('--selec-type-top',(Cell1.getBoundingClientRect().y- 2 - this.sheetstable.table.getBoundingClientRect().y)+'px');
        this.style.setProperty('--selec-type-left',(Cell1.getBoundingClientRect().x- 2 - this.sheetstable.table.getBoundingClientRect().x)+'px');
    }

    DefaultStylePropertys(){
        this.UpdateStylePropertys(this,this);
        if(this.inputconten){
            this.inputconten.remove();
        }
        this.inputconten=null;
    }
    
    #CreateInput(){
        if(!this.input){
            this.input=document.createElement('input');
            this.inputconten.appendChild(this.input);
            this.input.type='text';
            this.input.className='table-sheets-input-cell';
        }
        return this.input;
    }

    #CreateSelectorElement(){
        this.inputconten=document.createElement('div');
        this.inputconten.className='table-sheets-cell-input-conten';
        console.log(this.textConten);
        this.insertBefore(this.inputconten,this.textConten);
    }

    #mouse_down_event(event){
        if(this.sheetstable.cellselect && this.sheetstable.cellselect!=this){
            this.sheetstable.cellselect.select=false;
        }
        this.sheetstable._DeselecionarCells();
        let cell= check_mouse_element(event,SheetsCell);
        if(cell){
            this.sheetstable.cellselect=check_mouse_element(event,SheetsCell);
            cell.dataset["activo"]="true";
            this.#CreateSelectorElement();
            this.sheetstable._mousemove=true;
        }
    }

    #mouse_up_event(event){
        if(this.sheetstable._mousemove){
            this.sheetstable._mousemove=false;
        }
        if(this.sheetstable.cellselect==event.target){
            this.#CreateInput();
            this.UpdateStylePropertys(this,this);
            this.select=true;
        }
    }
}

class SheetsOpcions{
    constructor({
        rows=15,
        columns=10,
        addrows=true,
        addcolumns=true,
        maxrow=1000,
        maxcolums=100,
        fonsize=13,
        colorprimario='rgb(0, 217, 255)',
        maxprivius=5,
        sheetstable=null
    }){
        this.sheetstable=sheetstable;
        this.addrows=addrows;
        this.addcolumns=addcolumns;
        this.maxrow=maxrow;
        this.maxcolums=maxcolums;
        this.fonsize=fonsize;
        this.colorprimario=colorprimario;
        this.maxprivius=maxprivius;
        this.columns=columns;
        this.rows=rows;
    }

    //modifica el tamaño general de la hoja de calculo
    set fonsize(TamañoFuente){
        this.sheetstable.element.style.setProperty('--font-size',TamañoFuente+'px');
    }

    get fonsize(){
        return parseFloat(this.sheetstable.element.style.getPropertyValue('--font-size').replace('px',''));
    }

    //selecciona el color primario
    set colorprimario(val){
        this.sheetstable.element.style.setProperty('--color-primario',val);
    }

    get colorprimario(){
        this.sheetstable.element.style.getPropertyValue('--color-primario');
    }

    //Se aplica al modificar el numero de columnas
    set rows(val){
        for(let i=this.sheetstable.Rows.length;i<val;i++){
            this.sheetstable.Rows.push(new SheetsRow({sheetstable:this.sheetstable}));
            for(let j=0;j<this.sheetstable.Columns.length;j++){
                this.sheetstable.Rows[i].push(new SheetsCell({
                    sheetstable:this.sheetstable,
                    row:i,
                    colum:j
                }));
            }
        }
    }

    get rows(){
        return this.sheetstable.Rows.length;
    }

    set columns(DataColum){
        if((typeof DataColum)=='number'){
            for(let i=this.sheetstable.Columns.length; i< parseInt(DataColum);i++){
                this.sheetstable.Columns.push(new SheetsColum({sheetstable:this.sheetstable}));
            }
            return Array.from(this.sheetstable.Columns.map(Columna=>{return {'name': Columna.name}}));
        }
        DataColum.forEach((Columna, k) => {
            if(k<this.sheetstable.Columns.length){
                Object.keys(Columna).forEach(key=>{
                    if(this.sheetstable.Columns[k][key]){
                        this.sheetstable.Columns[k][key]=Columna[key];
                    }
                });
            }else{
                this.sheetstable.Columns.push(new SheetsColum(Columna));
            }
        });
        return Array.from(this.sheetstable.Columns.map(Columna=>{return {'name': Columna.name}}));
    }

    get columns(){
        return Array.from(this.sheetstable.Columns.map(Columna=>{return {'name': Columna.name}}));
    }
}

function columnaindex(columIndex){
    const abc="ABCDEFGHIJKLMNOPKRSTUVWXYZ";
    if(columIndex<abc.length){
        return abc[columIndex];
    }else{
        return columnaindex(parseInt((columIndex-abc.length)/abc.length))+columnaindex(columIndex-(abc.length*(parseInt((columIndex-abc.length)/abc.length)+1)));
    }
}

function check_mouse_element(event,typeElemet){
    for(let element of document.elementsFromPoint(event.clientX, event.clientY)){
        if(element instanceof typeElemet){
            return element;
        }
    }
    return null;
}


customElements.define('sheets-colum', SheetsColum, { extends: 'td' });
customElements.define('sheets-cell', SheetsCell, { extends: 'td' });
customElements.define('sheets-table', SheetsTable, { extends: 'div' });
customElements.define('sheets-rows', SheetsRow, { extends: 'tr' });
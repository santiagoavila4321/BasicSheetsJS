const SHEETS_FUNCTIONS={
    SUM:(x)=>{
        return math.sum(x);
    },
    UNIT:(a,unit)=>{
        return math.unit(a, unit);
    },
    CUNIT:(a,unit)=>{
        console.log(a);
        return a.to(unit);
    }
};

SHEETS_FUNCTIONS.SUM.toTex='\\sum{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.CUNIT.toTex=function(node, options){
    return node.args[0].toTex(options)+'_{\\text{unit}\\rightarrow'+node.args[1].toTex(options).replace(/"/g,'');
}
SHEETS_FUNCTIONS.UNIT.toTex=function(node, options){
    return node.args[0].toTex(options)+'\\text{ }'+node.args[1].toTex(options).replace(/"/g,'');
};

math.import(SHEETS_FUNCTIONS);



class SheetsTable{
    _mousemove=false;
    _cellselect=null;
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
        this.SelectorConten=document.createElement('div');
        this.element.appendChild(this.SelectorConten);
        this.ctrl_clikc=false;
        this.inputelement=null;
        this.id=element.id;

        //Variables de funcionamiento
        Object.defineProperties(this,{
            //Defino las opciones
            opcions:{
                value: new SheetsOpcions(Object.assign({sheetstable:this},opcions)),
                enumerable: true
            },
            SheetWidgetsCells:{
                value: [{
                    type:'List',
                    invocacion:/^=List\(((?<rango>[A-z]{1,3}\d+\:[A-z]{1,3}\d+)|(?<lista>(\[-?(\d+\.\d+|\d+|[A-Z]{1,3}\d+|\".*\"|[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+)(,-?(\d+\.\d+|\d+|[A-Z]{1,3}\d+|\".*\"|[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+))*\])))\)$/,
                    widgets: SheetsWidgetCellList
                },{
                    type:'Function',
                    invocacion:/^\=(?:(?:\.)?(?:[\+\-\*\/\^])?(?:[\(\[]+)?(?:[A-Z]+(?:[\(])|[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+|[A-Z]{1,3}\d+|\d+\.\d+|\d+|\"[A-Za-z0-9\^\/\*\(\)\+\-]+\")(?:[\)\]]+)?(?:[\,])?(?:[\)\]]+)?)+$/,
                    widgets: SheetsWidgetCellFunction
                },{
                    type:'Text',
                    invocacion:/.+/,
                    widgets: SheetsWidgetCellText
                }]
            }
        });

        //Defino variables
        this.cellselect=undefined;
        this.cellselect2=undefined;

        //asigno eventos
        this.keydown=(event)=>{
            if(document.body.contains(this.element)){
                this.#key_down(event);
            }else{
                document.removeEventListener('keydown',this.keydown);
            }
        };

        //asigno eventos
        this.keyup=(event)=>{
            if(document.body.contains(this.element)){
                this.#key_up(event);
            }else{
                document.removeEventListener('keyup',this.keyup);
            }
        };

        this.element.addEventListener('mousemove',this.#mousemovetable.bind(this));
        this.element.addEventListener('mousedown',this.#mousedown.bind(this));
        this.element.addEventListener('mouseup',this.#mouseup.bind(this));
        document.addEventListener('keydown',this.keydown);
        document.addEventListener('keyup',this.keyup);

        //Asignamos al elmento madre
        element.appendChild(this.element);
    }

    set cellselect(cell){
        if(!this.ctrl_clikc){
            Array.from(this.element.querySelectorAll('.tabla-sheet-seleccion')).forEach(selectorElement=>{
                selectorElement.remove();
            });
        }
        if(this.cellselect2){
            this.cellselect2=undefined;
        }
        this._cellselect=cell;
    }

    get cellselect(){
        return this._cellselect;
    }

    get TableHead(){
        return this.table.tHead;
    }

    get TableBody(){
        return this.table.tBodies[0];
    }

    get Columns(){
        return this.TableHead.querySelectorAll('td:not(:first-child)');
    }

    get Rows(){
        return this.TableBody.rows;
    }

    deseleccion(){
        Array.from(this.element.querySelectorAll('.tabla-sheet-seleccion')).forEach(selectorElement=>{
            selectorElement.remove();
        });
    }

    Cells(range=undefined){
        if((typeof range)=='string'){
            //Buscamos por formato A1
            if(/^[A-Z]{1,3}[0-9]+$/.test(range)){
                return this.TableBody.querySelector(`td[data-address=${range}]`);
            
            //Buscamos en un rango por ejemplo D2:G23
            }else if(/^[A-Z]{1,3}[0-9]+[\:][A-Z]{1,3}[0-9]+$/.test(range)){
                return this.#selecs_cels(this.TableBody.querySelector(`td[data-address=${range.split(':')[0]}]`),
                                        this.TableBody.querySelector(`td[data-address=${range.split(':')[1]}]`)
                );
            }
        }else if(range instanceof  Array){
            //Buscamos por coordenadas en un rango [rango1,rango2]
            if((range[0] instanceof Array) && range.length==2){
                return this.#selecs_cels(this.Rows[range[0][0]].childNodes[range[0][1]],this.Rows[range[1][0]].childNodes[range[1][1]]);
            
            //Buscamos por coorenadas [2 , 4]
            }else if((typeof range[0])=='number'){
                return this.Rows[range[0]].childNodes[range[1]];
            }
        //si no hay expreción devuleve todas la celdas
        }else if(range===undefined){
            return Array.from(this.Rows).map(row=>{
                return Array.from(row.querySelectorAll('td:not(:first-child)'));
            });
        }
    }

    deteColum(index){
        if(!this.opcions.addcolumns){
            return undefined;
        }
        this.Columns[index].remove();
        this.#UpdateIndexColum(index,-1);

        return true;
    }

    addColum(index){
        if(!this.opcions.addcolumns){
            return false;
        }

        let colums=this.Columns;
        this.#UpdateIndexColum(index,1);

        if(index>=colums.length){
            this.TableHead.appendChild(new SheetsColum({
                sheetstable:this,
                columIndex:colums.length
            }));
        }else{
            this.TableHead.insertBefore(new SheetsColum({
                sheetstable:this,
                columIndex:index
            }),colums[index]);
        }

        for(let row of this.Rows){
            row.insertBefore(new SheetsCell({sheetstable:this}),index);
        }

        return true;
    }

    deteRow(index){
        if(!this.opcions.addrows){
            return false;
        }

        this.#UpdateIndexRows(index,-1);
        this.Rows[index].remove();
    }

    addRow(index){
        if(!this.opcions.addrows){
            return false;
        }
        let indece=index;
        if(index>=this.Rows.length){
            this.TableBody.appendChild(new SheetsRow({
                sheetstable:this,
                index:this.Rows.length
            }));
            indece=this.Rows.length-1;
        }else{
            this.#UpdateIndexRows(indece,1);
            this.TableBody.insertBefore(new SheetsRow({
                sheetstable:this,
                index:indece
            }),this.Rows[indece]);
        }

        for(let i=0;i<this.Columns.length;i++){
            this.Rows[indece].appendChild(new SheetsCell({sheetstable:this}));
        }
        this.Rows[indece],index=indece;
    }

    WidgetsCellsDifine(type,invocacion,widgets){
        this.SheetWidgetsCells.splace(0,0,{type:type,invocacion:invocacion,widgets: widgets});
        return this.SheetWidgetsCells[0];
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
            let row=[];
            for(let j=c;j<=d;j++){
                row.push(this.Rows[i].childNodes[j+1]);
            }
            cellselects.push(row);
        }
        return cellselects;
    }

    #UpdateIndexColum(index,desplazamiento=0){
        let colums=this.Columns;
        for(let i=index;i<colums.length;i++){
            colums[i].index=i+desplazamiento;
        }
    }

    #UpdateIndexRows(index,desplazamiento=0){
        for(let i=index;i<this.Rows.length;i++){
            this.Rows[i].index=i+desplazamiento;
        }
    }

    //mouse eventes
    #mousedown(event){
        if(this.cellselect){
            this.cellselect.widgets.readinput();
            this.cellselect.select=false;
        }
        this.cellselect=null;
    }
    #mouseup(event){
        if(!this.inputelement){
            this.ctrl_clikc=event.ctrlKey;
        }
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
            if(this.cellselect.inputconten){
                this.cellselect.inputconten.move=true;
                this.cellselect.inputconten.cellselects=this.#selecs_cels(this.cellselect,celda);
            }
        }
    }

    //keys events
    #key_up(event){
        if(!this.inputelement){
            this.ctrl_clikc=event.ctrlKey;
        }
    }
    #key_down(event){
        if(!this.inputelement){
            this.ctrl_clikc=event.ctrlKey;
        }
        if(event.shiftKey){
            if(this.#Arrow_press(event.key)){
                return;
            }
        }
        if(event.key==='Escape'){
            this.cellselect=null;
            return;
        }
        if(event.key==='Delete'){
            for(let selectorElement of this.SelectorConten.childNodes){
                if(!selectorElement.SelectorVisual){
                    selectorElement.cellselects.flat().forEach(cell=>{
                        cell.value=null;
                    });
                }
            }
            this.cellselect=null;
            return;
        }
    }

    #get_cell2(row=0,colum=0,cells2=null){
        if(cells2.row+row>=0 && cells2.row+row<this.Rows.length && cells2.colum+colum>=0 && cells2.colum+colum<this.opcions.columns.length){
            return this.Rows[cells2.row+row].childNodes[cells2.colum+colum+1];
        }
        return cells2;
    }
    #select_cell2(row=0,colum=0){
        if(!this.cellselect){
            return false;
        }
        this.cellselect2=this.#get_cell2(row,colum,(this.cellselect2)? this.cellselect2: this.cellselect);
        this.cellselect.inputconten.cellselects=this.#selecs_cels(this.cellselect,this.cellselect2);
        return true;
    }

    #Arrow_press(key){
        if(key==='ArrowLeft' && this.#select_cell2(0,-1)){
            return true;
        }else if(key==='ArrowRight' && this.#select_cell2(0,1)){
            return true;
        }else if(key==='ArrowUp' && this.#select_cell2(-1,0)){
            return true;
        }else if(key=='ArrowDown' && this.#select_cell2(1,0)){
            return true;
        }
        return false;
    }
}

class SheetsRow extends HTMLTableRowElement{
    constructor({sheetstable=null,index=0}){
        super();
        this.sheetstable=sheetstable,
        this.IndexElement=document.createElement('td');
        this.appendChild(this.IndexElement);
        this.IndexElement.addEventListener('click',this.#ClickRow.bind(this));
        this.index=index;
    }

    set index(index){
        this.IndexElement.innerText=index+1;
        this.UpdateIndexColum(0,0);
        return index;
    }

    get index(){
        return parseInt(this.IndexElement.innerText);
    }

    get set(){
        return parseInt(this.IndexElement.innerText);
    }

    get Cells(){
        return this.querySelectorAll('td:not(:first-child)');
    }

    appendChild(cell){
        if(cell instanceof SheetsCell){
            cell.sheetstable=this.sheetstable;
            cell.coordenada=[this.index-1,this.childNodes.length-1];
        }
        super.appendChild(cell);
    }

    UpdateIndexColum(index,desplazamiento=0){
        let length = this.childNodes.length;
        for(let i=index+1;i<length;i++){
            this.childNodes[i].coordenada=[this.index-1,i+desplazamiento-1];
        }
    }

    insertBefore(cell,index){
        if(!(cell instanceof SheetsCell)){
            return super.insertBefore(cell,index);
        }
        cell.sheetstable=this.sheetstable;
        cell.coordenada=[this.index-1,index];
        for(let i=index+1;i<this.childNodes.length;i++){
            let address=this.childNodes[i].address+'';
            this.childNodes[i].coordenada=[this.index-1,i];
        }

        if(index>=this.childNodes.length-1){
            return this.appendChild(cell);
        }

        return super.insertBefore(cell,this.childNodes[index+1]);
    }

    remove(){
        let celss=[];
        for(let cell of this.childNodes){
            celss.push({'type':cell.type,'value':cell.value});
        }
        super.remove();
        return celss;
    }

    #ClickRow(event){
        event.stopPropagation();
        this.sheetstable.ctrl_clikc=false;
        this.sheetstable.cellselect=this.Cells[0];
        this.sheetstable.cellselect.CreateSelectorElement();
        this.sheetstable.cellselect.inputconten.cellselects=[Array.from(this.Cells)];
    }
}

class SheetsColum extends HTMLTableCellElement{
    _index=0;
    constructor({sheetstable=null,columIndex=0,name=null,modific=true}){
        super();
        this.className='table-colum-sheets';
        this.sheetstable=sheetstable;
        this.name=(name!==null)? name : columnaindex(columIndex);
        this.modific=modific;
        this.index=columIndex;
        this.addEventListener('click',this.#ClickColum.bind(this));
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
        return Array.from(this.sheetstable.Rows).map(row=>row.childNodes[this.index+1]);
    }

    remove(){
        let celss=[];
        for(let row of this.sheetstable.Rows){
            let cell = row.childNodes[this.index+1];
            celss.push({'type':cell.type,'value':cell.value});
            cell.remove();
        }

        super.remove();
        return celss;
    }

    #ClickColum(event){
        event.stopPropagation();
        this.sheetstable.ctrl_clikc=false;
        this.sheetstable.cellselect=this.Cells[0];
        this.sheetstable.cellselect.CreateSelectorElement();
        this.sheetstable.cellselect.inputconten.cellselects=this.Cells.map(cell=>[cell]);
    }
    
}

class SheetsCell extends HTMLTableCellElement{
    _selecolor='';
    constructor({sheetstable=null,row=0,colum=0,value={type:'Text',value:''}}){
        super();
        //DEfino los parametros de tabla 
        this.sheetstable=sheetstable;
        this.type='';

        //coordenadas de la celda 
        this.coordenada=[row,colum];
        this.className='table-sheets-celda'; //clase del elemento td
        
        this.addEventListener('mousedown',this.#mouse_down_event);
        this.addEventListener('mouseup',this.#mouse_up_event);

        this.input=null;
        this.Events={};
        this.widgets=new SheetsWidgetCellText({sheetcell:this,data:value});
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
            //this.DefaultStylePropertys();

            this.deseleccion();
            this.SelecColor='';
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
        this.dataset['address']=this.address;
    }

    get coordenada(){
        return [this.row,this.colum];
    }

    set value(value){
        this.widgets.value=value;
    }

    get value(){
        return this.widgets.value;
    }

    set type(val){
        this.setAttribute('type',val);
    }
    get type(){
        return this.getAttribute('type');
    }

    set SelecColor(color){
        if(this._selecolor!=color){
            this.style.setProperty('--selec-type-color',`color-mix(in srgb, ${color} 30%, rgba(255, 255, 255, 0))`);
            this._selecolor=color;
        }
    }

    get SelecColor(){
        return this._selecolor;
    }

    addEvent(evento,funcion){
        if(!this.Events[evento]){
            this.Events[evento]=[];
        }
        this.Events[evento].push(funcion);
    }

    detEvent(evento,funcion){
        if(this.Events[evento]){
            for(let [i,e] of this.Events[evento].entries()){
                if(e==funcion){
                    this.Events[evento].splice(i,1);
                    break;
                }
            }
        }
    }

    remove(){
        this.sheetstable.Rows[this.row].UpdateIndexColum(this.colum,-1);
        super.remove();
    }

    deseleccion(){
        this.inputremove();
        if(this.inputconten){
            this.inputconten.remove();
            this.inputconten=null;
        }
    }

    inputremove(){
        if(this.input){
            this.input.remove();
            this.input=null;
        }
    }

    UpdateStylePropertys(Cell1,Cell2){
        if(this.inputconten){
            this.inputconten.style.left=(Cell1.getBoundingClientRect().x- 2 - this.sheetstable.table.getBoundingClientRect().x)+'px';
            this.inputconten.style.top=(Cell1.getBoundingClientRect().y- 2 - this.sheetstable.table.getBoundingClientRect().y)+'px';
            this.inputconten.style.width=(Cell2.getBoundingClientRect().x - Cell1.getBoundingClientRect().x + Cell2.getBoundingClientRect().width-1)+'px';
            this.inputconten.style.height=(Cell2.getBoundingClientRect().y - Cell1.getBoundingClientRect().y +  Cell2.getBoundingClientRect().height-1)+'px';
        }
    }

    DefaultStylePropertys(){
        this.UpdateStylePropertys(this,this);
        if(this.inputconten){
            this.inputconten.remove();
        }
        this.inputconten=null;
    }

    CreateSelectorElement(isCellcreado=true){
        if(this.inputconten){
            return false;
        }
        this.inputconten=new SheetsSelector({sheetcell:this,isCellcreado:isCellcreado});
        this.UpdateStylePropertys(this,this);
        this.inputconten.addEventListener('mousedown',this.#mouse_down_event.bind(this));
        this.inputconten.addEventListener('mouseup',this.#mouse_up_event.bind(this));
    }

    CellColorSelection(color){
        this.select=true;
    }

    
    CreateInput(){
        if(!this.input && this.inputconten){
            this.input=new SheetsInput({sheetcell:this});
            this.input.type='Text';
            this.inputconten.appendChild(this.input);
            this.widgets.InputCreate();
        }
        return this.input;
    }

    #mouse_down_event(event){
        let cell=check_mouse_element(event,SheetsCell);
        //guarda los datos en la celda y deselecciona
        if(this.sheetstable.cellselect && this.sheetstable.cellselect!=cell && !this.sheetstable.ctrl_clikc){
            this.sheetstable.cellselect.widgets.readinput();
            this.sheetstable.cellselect.select=false;
        }

        if(this.sheetstable.ctrl_clikc && (event.target instanceof SheetsSelector)){
            event.target.remove();
            event.stopPropagation();
            return;
        }
        if(cell){
            if(this.sheetstable.cellselect && this.sheetstable.cellselect!=cell && event.ctrlKey && this.sheetstable.cellselect.inputconten){
                this.sheetstable.cellselect.inputremove();
            }
            this.sheetstable.cellselect=cell;
            cell.CreateSelectorElement();
            if(!this.input){
                this.sheetstable._mousemove=true;
            }
            event.preventDefault();
        }
        event.stopPropagation();
    }

    #mouse_up_event(event){
        let cell= check_mouse_element(event,SheetsCell);
        if(this.sheetstable._mousemove){
            this.sheetstable._mousemove=false;
        }
        if(this.sheetstable.cellselect && this.sheetstable.cellselect.inputconten){
            this.sheetstable.cellselect.inputconten.move=false;
        }
        if(this.sheetstable.cellselect==cell && !this.sheetstable.ctrl_clikc){
            this.CreateInput();
            if(this.input){
                this.widgets.Inputclick();
            }
            this.UpdateStylePropertys(this,this);
            this.select=true;
        }
        event.preventDefault();
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
        return this.sheetstable.element.style.getPropertyValue('--color-primario');
    }

    //Se aplica al modificar el numero de columnas
    set rows(val){
        for(let i=this.sheetstable.Rows.length;i<val;i++){
            this.sheetstable.TableBody.appendChild(new SheetsRow({sheetstable:this.sheetstable,index:i}));
            for(let j=0;j<this.sheetstable.Columns.length;j++){
                this.sheetstable.Rows[i].appendChild(new SheetsCell({sheetstable:this.sheetstable}));
            }
        }
    }

    get rows(){
        return this.sheetstable.Rows.length;
    }

    set columns(DataColum){
        if((typeof DataColum)=='number'){
            for(let i=this.sheetstable.Columns.length; i< parseInt(DataColum);i++){
                this.sheetstable.TableHead.appendChild(new SheetsColum({sheetstable:this.sheetstable,columIndex:i}));

            }
            return Array.from(this.sheetstable.Columns).map(Columna=>{return {'name': Columna.name}});
        }
        DataColum.forEach((Columna, k) => {
            if(k<this.sheetstable.Columns.length){
                Object.keys(Columna).forEach(key=>{
                    if(this.sheetstable.Columns[k][key]){
                        this.sheetstable.Columns[k][key]=Columna[key];
                    }
                });
            }else{
                this.sheetstable.Columns.appendChild(new SheetsColum(Columna));
            }
        });
        return Array.from(this.sheetstable.Columns).map(Columna=>{return {'name': Columna.name}});
    }

    get columns(){
        return Array.from(this.sheetstable.Columns).map(Columna=>{return {'name': Columna.name}});
    }
}

//OBjeto selector
class SheetsSelector extends HTMLDivElement{
    _selects=[];
    _color='';
    constructor({sheetcell=null,isCellcreado=true}){
        super();
        this.cell=sheetcell;
        this.isCellcreado=isCellcreado;
        this.className='tabla-sheet-seleccion';

        if(this.cell.sheetstable.SelectorConten.childNodes.length==0){
            this.color=this.cell.sheetstable.opcions.colorprimario;
        }else{
            this.color=colorsecuencia(this.cell.sheetstable.SelectorConten.childNodes.length-1);
        }
        this.cell.sheetstable.SelectorConten.appendChild(this);
        this.SelectorVisual=false;
        this.cellselects=[[this.cell]];
        this.Matrix=[];

        //Identificador de borde solido o con trazos
        this.move=false;
        this.addEventListener('mouseup',this.#Mouseup.bind(this));
    }

    UpdateStylePropertys(Cell1,Cell2){
        this.style.left=(Cell1.getBoundingClientRect().x- 2 - this.cell.sheetstable.table.getBoundingClientRect().x)+'px';
        this.style.top=(Cell1.getBoundingClientRect().y- 2 - this.cell.sheetstable.table.getBoundingClientRect().y)+'px';
        this.style.width=(Cell2.getBoundingClientRect().x - Cell1.getBoundingClientRect().x + Cell2.getBoundingClientRect().width-1)+'px';
        this.style.height=(Cell2.getBoundingClientRect().y - Cell1.getBoundingClientRect().y +  Cell2.getBoundingClientRect().height-1)+'px';
    }
    
    set move(val){
        this.style['transition']=(val)? '0.2s':'-1s';
    }

    set SelectorVisual(val){
        if(val){
            this.style['border-style']='dashed';
        }else{
            this.style['border-style']='solid';
        }
    }

    get SelectorVisual(){
        return this.style['border-style']=='dashed';
    }

    set color(val){
        if(val!=this._color){
            this.style['border-color']=`color-mix(in srgb, ${val} 60%, black)`;
            this.style['background']=`color-mix(in srgb, ${val} 10%, rgba(255,255,255,0))`;
            this._color=val;
        }
        return this._color;
    }
    get color(){
        return this._color;
    }

    set cellselects(cells){
        if(this.cell.inputconten){
            this.cell.inputremove();
        }
        this.CellDeselecion();
        this._selects=cells;
        this.CellSelects();
        this.GetRangeInput();
    }
    get cellselects(){
        return this._selects;
    }

    GetRangeInput(){
        if(this._selects.flat().length<1){
            return;
        }
        if(this._selects.flat().length>1){
            this.dataset['seleccions']=this._selects[0][0].address+':'+this._selects[this._selects.length-1][this._selects[this._selects.length-1].length-1].address;
        } else{
            this.dataset['seleccions']=this._selects[0][0].address;
        }

        if(this.cell.sheetstable.ctrl_clikc && this.cell.sheetstable.inputelement && this.isCellcreado){
            this.InpuAddRange();
        }
        
        return this.dataset['seleccions'];
    }

    InpuAddRange(){
        if(this.cell.sheetstable.inputelement.selectionStart<1 && this.cell.sheetstable.inputelement.value[0]!='='){
            return;
        }
        this.SelectorVisual=true;
        let selectionStart=this.cell.sheetstable.inputelement.selectionStart;
        let select=null;

        for(let celltext of this.cell.sheetstable.inputelement.cellsintext){
            if(selectionStart>=celltext.index && selectionStart<=celltext.index+celltext.result.length){
                select=celltext;
                break;
            }
        }

        if(!select){
            let text=this.cell.sheetstable.inputelement.value.slice(0,selectionStart);
            let test2=this.cell.sheetstable.inputelement.value.slice(selectionStart);
            this.cell.sheetstable.inputelement.value=text+this.dataset['seleccions']+test2;

            this.cell.sheetstable.inputelement.cellsintext.forEach(celtext=>{
                if(celtext.index>text.length){
                    celtext.index=celtext.index+text.length;
                }
            });

            this.cell.sheetstable.inputelement.cellsintext.push({index:text.length,result:this.dataset['seleccions'],selector:this});
            this.cell.sheetstable.inputelement.focus();
            this.cell.sheetstable.inputelement.setSelectionRange(text.length+this.dataset['seleccions'].length,text.length+this.dataset['seleccions'].length);
            return;
        }
        this.color=select.selector.color;
        let text=this.cell.sheetstable.inputelement.value.slice(0,select.index);
        let test2=this.cell.sheetstable.inputelement.value.slice(select.index+select.result.length);
        let disferenacia=this.dataset['seleccions'].length-select.result.length;
        this.cell.sheetstable.inputelement.value=text+this.dataset['seleccions']+test2;
        select.result=this.dataset['seleccions'];
        this.cell.sheetstable.inputelement.cellsintext.forEach(celtext=>{
            if(celtext.index>select.index){
                celtext.index=celtext.index+disferenacia;
            }
        });
        if(select.selector!=this){select.selector.remove();select.selector=this;}
        //this.cell.sheetstable.inputelement.CellTextUpdate(select);
        this.cell.sheetstable.inputelement.focus();
        this.cell.sheetstable.inputelement.setSelectionRange(select.index+this.dataset['seleccions'].length,select.index+this.dataset['seleccions'].length);
    }

    CellSelects(){
        this._selects.flat().forEach(cell=>{
            cell.select=true;
            cell.SelecColor=this.color;
        });
        if(this._selects.length>0){
            this.UpdateStylePropertys(this._selects[0][0],this._selects[this._selects.length-1][this._selects[this._selects.length-1].length-1]);
        }
    }

    CellDeselecion(){
        this._selects.flat().forEach(cell=>{
            if(cell!=this.cell && (!this.cell.sheetstable.ctrl_clikc || !cell.inputconten)){
                cell.select=false;
            }
        });
    }

    remove(){
        this.CellDeselecion();
        this.cellselects=[];
        this.cell.inputconten=null;
        super.remove();
        if(this.cell.select){
            this.cell.select=false;
        }
    }

    #Mouseup(event){
        if(this.cell.sheetstable.ctrl_clikc && this.cell.sheetstable.inputelement && this.isCellcreado){
            this.cell.sheetstable.inputelement.cell.widgets.Inpuntkey(event);
        }
    }
}

//input class
class SheetsInput extends HTMLInputElement{
    constructor({sheetcell=null}){
        super();
        this.cell=sheetcell;
        this.addEventListener('keydown',this.#key_down_events.bind(this));
        this.addEventListener('mousedown',(event)=>{event.stopPropagation()});
        this.addEventListener('mouseup',(event)=>{event.stopPropagation()});
        this.value=this.cell.value;
        this.addEventListener('input',this.#Keyinput.bind(this));
        this.cell.sheetstable.inputelement=this;
        this.cellsintext=[];
    }

    remove(){
        this.cell.sheetstable.inputelement=null;
        this.cell.widgets.InputRemove();
        super.remove();
    }

    #ChangeCells(row=0,colum=0){
        if(this.cell.row+row>=0 && this.cell.row+row<this.cell.sheetstable.opcions.rows && this.cell.colum+colum>=0 && this.cell.colum+colum<this.cell.sheetstable.opcions.columns.length){
            this.cell.sheetstable.ctrl_clikc=false;
            this.cell.widgets.readinput();
            this.cell.sheetstable.cellselect=this.cell.sheetstable.Rows[this.cell.row+row].childNodes[this.cell.colum+colum+1];
            this.cell.sheetstable.cellselect.CreateSelectorElement();
            this.cell.sheetstable.cellselect.CreateInput();
            this.cell.sheetstable.cellselect.widgets.Inputclick();
            return true;
        }
        return false;
    }

    //key events
    #key_down_events(event){
        if(!event.shiftKey){
            if(this.#ArrowPress(event.key)){
                return null;
            }

            if(this.#EnterTabPress(event)){
                return null;
            }
        }else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
            event.preventDefault();
        }
    }

    #ArrowPress(key){
        if(key==='ArrowLeft' && this.selectionStart==0){
            this.#ChangeCells(0,-1);
        }else if(key==='ArrowRight' && this.selectionStart==this.value.length){
            this.#ChangeCells(0,1);
        }else if(key==='ArrowUp'){
            this.#ChangeCells(-1,0);
        }else if(key=='ArrowDown'){
            this.#ChangeCells(1,0);
        }else{
            return false;
        }
        return true;
    }

    #EnterTabPress(event){
        if(event.key==='Enter'){
            event.preventDefault();
            this.cell.sheetstable.ctrl_clikc=false;
            if(this.cell.row+1>=this.cell.sheetstable.Rows.length){
                this.cell.sheetstable.addRow(this.cell.sheetstable.Rows.length);
            }
            this.#ChangeCells(1,0);
        }else if(event.key==='Tab'){
            event.preventDefault();
            this.cell.sheetstable.ctrl_clikc=false;
            if(this.cell.colum+1>=this.cell.sheetstable.Columns.length){
                this.cell.sheetstable.addColum(this.cell.sheetstable.Columns.length);
            }
            this.#ChangeCells(0,1);
        }else if(event.key==='Delete'){
            event.stopPropagation();
            this.cell.sheetstable.ctrl_clikc=false;
            this.cell.value='';
        }
    }
    deseleccion(){
        Array.from(this.cell.sheetstable.element.querySelectorAll('.tabla-sheet-seleccion')).forEach(selectorElement=>{
            if(selectorElement.cell && selectorElement.cell!=this.cell){
                selectorElement.cell.select=false;
            }else if(!selectorElement.cell){
                selectorElement.remove();
            }
        });
        if(this.cellsintext.length>0){
            this.cellsintext=[];
        }
    }
    CellTextUpdate(){
        const patron=/([A-Z]{1,3}\d+\:[A-Z]{1,3}\d+)|([A-Z]{1,3}\d+)/mg;
        let resultado=patron.exec(this.value);
        this.cellsintext=[];
        while(resultado){
            let selector=null;
            let objectoText={};
            if(resultado[0].includes(':')){
                this.cell.sheetstable.Cells(resultado[0].split(':')[0]).CreateSelectorElement(false);
                selector=this.cell.sheetstable.Cells(resultado[0].split(':')[0]).inputconten;
                selector.cellselects=this.cell.sheetstable.Cells(resultado[0]);
            }else{
                this.cell.sheetstable.Cells(resultado[0]).CreateSelectorElement(false);
                selector=this.cell.sheetstable.Cells(resultado[0]).inputconten;
            }
            selector.SelectorVisual=true;
            selector={index:resultado.index,result:resultado[0],selector:selector};
            this.cellsintext.push(selector);
            resultado=patron.exec(this.value);
        }
        return this.cellsintext;
    }

    isFunction(){
        const funcionpatron=/^\=(?:(?:\.)?(?:[\+\-\*\/\^])?(?:[\(\[]+)?(?:[A-Z]+(?:[\(])|[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+|[A-Z]{1,3}\d+|\d+\.\d+|\d+|\"[A-Za-z0-9\^\/\*\(\)\+\-]+\")(?:[\)\]]+)?(?:[\,])?(?:[\)\]]+)?)+$/;
        
        if(this.cell.type!='Function' && funcionpatron.test(this.value)){
            return true;
        }else if(this.cell.type=='Function' && !funcionpatron.test(this.value)){
            return false;
        }
        return null;
    }

    #Keyinput(event){
        this.deseleccion();
        let isfun=this.isFunction();
        if(this.value[0]=='='){

            if(!this.cell.sheetstable.ctrl_clikc){
                this.cell.sheetstable.ctrl_clikc=true;
            }
            this.cell.widgets=(isfun)? new SheetsWidgetCellFunction({sheetcell:this.cell}):this.cell.widgets;
            this.CellTextUpdate();
            if(this.cell.type=='Function' && !this.cell.widgets.selecte_conten){
                this.cell.widgets.CreateVisualEquation();
            }
        }else{
            if(this.cell.sheetstable.ctrl_clikc){
                this.cell.sheetstable.ctrl_clikc=false;
            }
            if(isfun===false){
                this.cell.widgets.InputRemove();
                this.cell.widgets=new SheetsWidgetCellText({sheetcell:this.cell});
            }
        }
        this.cell.widgets.Inpuntkey(event);
    }
}


// Widget para las Celdas
class SheetsWidgetCellText{
    constructor({sheetcell=null,data={type:'Text', value:''}}){
        this.cell=sheetcell;
        this.cell.type='Text';
        this.data=data;
        this.cell.dataset['type']='Text';
    }

    set data(rawdata){
        if(rawdata.type!=this.cell.type){
            for(let widgetType of this.cell.sheetstable.SheetWidgetsCells){

                if(widgetType.type==rawdata.type){

                    if(!(this instanceof widgetType.widgets) || widgetType.type=='Text'){
                        this.cell.widgets=new widgetType.widgets({
                            sheetcell:this.cell,
                            data:rawdata
                        });
                        return;
                    }
                    break;
                }
            }
        }
        this.rawdata=Object.assign((this.rawdata)?this.rawdata:{},rawdata);
        this.value=this.rawdata.value;
    }

    get data(){
        return this.rawdata;
    }

    set value(value){
        let com = this.#CheckValue(value);
        if(com){
            this.DisplayText();
        }
        return this.rawdata.value;
    }

    EventChange(){
        if(this.cell && this.cell.Events['change']){
            for(let evento of this.cell.Events['change']){
                evento({target:this.cell,widgets:this,cell:this.cell.address,event:'change'});
            }
        }
    }

    get value(){
        return this.rawdata.value;
    }

    Inputclick(){
        if(this.cell.input){
            this.cell.input.value=this.value;
            this.cell.input.select();
        }
    }

    readinput(){
        if(this.cell.input){
            this.value=this.cell.input.value;
        }
    }

    NumeroFormat(num,digits){
        let valoraw = (num+'').split('.');
        if(!valoraw[1]){
            valoraw.push('0');
        }
        for(let k=0;k<digits-valoraw[1].length;k++){
            valoraw[1]=valoraw[1]+'0';
        }
        return valoraw.join('.');
    }

    DisplayText(){
        this.cell.style['text-align']=(this.rawdata.textalign)? this.rawdata.textalign:'';
        this.cell.style['font-size']=(this.rawdata.fonsize)? this.rawdata.fonsize+'px':'';
        this.cell.style['background']=(this.rawdata.color)? this.rawdata.color: '';

        if(this.rawdata.digits==0){
            this.rawdata.typeText=='Entero';
        }

        this.rawdata.DisplayText=this.rawdata.value;

        if((typeof this.rawdata.value)=='number' && this.rawdata.typeText!='Entero'){
            if(!this.rawdata.digits){
                this.rawdata.digits=2;
            }
            let valoraw=(Math.round(this.rawdata.value*(10**this.rawdata.digits))/(10**this.rawdata.digits))+'';

            this.rawdata.DisplayText=this.NumeroFormat(valoraw,this.rawdata.digits);
        }
        this.cell.innerText=this.rawdata.DisplayText;
        this.EventChange();
    }

    CheckTypeValue(value){
        for(let widgetType of this.cell.sheetstable.SheetWidgetsCells){
            if(widgetType.invocacion.test(value) && widgetType.type!=this.cell.type){
                this.cell.widgets=new widgetType.widgets({sheetcell:this.cell});
                this.cell.widgets.Serializacion(value);
                return false;
            }
        }
        if(value+''!=this.rawdata.value+''){
            return this.Serializacion(value);
        }
        return false;
    }

    Serializacion(value){
        if(isNaN(Number(value))){
            this.rawdata.value=value;
            this.rawdata.DisplayText=value;
            if(!this.rawdata.textalign || this.rawdata.typeText!='Text'){
                this.rawdata.textalign='center';
            }
            this.cell.dataset['type']='Text';
            this.rawdata.typeText='Text';
            return true;
        }else{
            this.rawdata.value=Number(value);
            if(!this.rawdata.textalign || this.rawdata.typeText=='Text'){
                this.rawdata.textalign='end';
            }
            if(!this.rawdata.typeText || this.rawdata.typeText=='Text' || (!this.IsEntero(value) && this.rawdata.typeText=='Entero')){
                this.rawdata.typeText=(!this.IsEntero(value))? 'Numero': 'Entero';
            }
            return true;
        }
    }

    IsEntero(num){
        return !((num+'').split('.').length>1);
    }

    InputCreate(){
        return null;
    }
    InputRemove(){
        return null;
    }

    Inpuntkey(event){
        return null;
    }

    #CheckValue(value){
        if(value==='' || value===null || value===undefined){
            this.rawdata.value='';
            this.rawdata.DisplayText='';
            if(this.cell.type!='Text' && value!==''){
                this.cell.widgets=new SheetsWidgetCellText({sheetcell:this.cell});
            }
            this.cell.dataset['type']='Text';
            return true;
        }
        return this.CheckTypeValue(value);
    }
}

class SheetsWidgetCellList extends SheetsWidgetCellText{
    constructor({sheetcell=null,data={type:'List', value:'',list:[''],index:0}}){
        super({sheetcell:sheetcell,data:data});

        this.rawdata.textalign='left';
        this.cell.type='List';
        this.selecte_conten=null;
        if(!this.rawdata.scope){
            this.rawdata.scope={};
        }else{
            this.#Loadscope();
        }
        this.DisplayText();

        this.Cell_Update_event=(event)=>{
            this.#CellEventUpdate(event);
        }

        this.scrol_padre_elemen=(event)=>{
            this.UpdateConten();
        };
    }

    CheckTypeValue(value){
        if(isNaN(parseInt(value))){
            return false;
        }
        if(value<this.rawdata.list.length){
            this.rawdata.index=value;
            this.rawdata.value=this.rawdata.list[value];
            this.rawdata.DisplayText=this.rawdata.list[value];
            if((typeof this.rawdata.value)=='number'){
                this.rawdata.typeText=(!this.IsEntero(this.rawdata.value))? 'Numero': 'Entero';
            }else{
                this.rawdata.typeText='Text';
            }
        }
        return true;
    }

    UpdateConten(){
        if(this.selecte_conten){
            this.selecte_conten.style.left=this.cell.getBoundingClientRect().x+'px';
            this.selecte_conten.style.top=(this.cell.getBoundingClientRect().y+this.cell.getBoundingClientRect().height+5)+'px';
        }
    }

    CreateList(List){
        if(!this.selecte_conten){
            this.selecte_conten=document.createElement('div');
            this.selecte_conten.className='table-sheets-list-box-selectro-contenedor';
            this.selecte_conten.style.setProperty('--color-primario',this.cell.sheetstable.opcions.colorprimario);
            this.UpdateConten();
        }
        this.selecte_conten.innerHTML='';
        let scope_selec=Object.fromEntries(Object.keys(this.rawdata.scope).map(key=>{
            let a= this.rawdata.scope[key].map(scop=>{
                return [scop.index,{cell:key,rango:(scop.rango)? scop.rango:false}];
            });
            return a;
        }).flat(1));
        let rangos=[];
        List.forEach(a=>{
            let item=document.createElement('div');
            let itemincono=document.createElement('i');
            itemincono.className='bi bi-caret-right-square-fill';
            let spantext=document.createElement('span');
            spantext.innerText=((typeof a.value)=='number' && !this.IsEntero(a.value))? this.NumeroFormat(typeof a.value,2): a.value;
            item.className='table-sheet-item-selector';
            item.dataset['index']=a.index;


            item.addEventListener('mousedown',(event)=>{
                event.stopPropagation();
                this.cell.value=parseInt(item.dataset['index']);
                this.cell.select=false;
                Object.keys(this.rawdata.scope).forEach(address=>{
                    this.cell.sheetstable.Cells(address).select=false;
                });
            });

            item.appendChild(itemincono);
            item.appendChild(spantext);

            if(scope_selec[a.index]){
                let cell= this.cell.sheetstable.Cells(scope_selec[a.index].cell);
                if(scope_selec[a.index].rango==false || !rangos.includes(scope_selec[a.index].rango)){
                    cell.CreateSelectorElement();
                    cell.inputconten.SelectorVisual=true;
                    itemincono.style.color=cell.inputconten.color;
                }else{
                    itemincono.style.color=cell.SelecColor;
                }

                if(!rangos.includes(scope_selec[a.index].rango) && scope_selec[a.index].rango!=false){
                    cell.inputconten.cellselects= this.cell.sheetstable.Cells(scope_selec[a.index].rango);
                    rangos.push(scope_selec[a.index].rango);
                }
            }
            this.selecte_conten.appendChild(item);
        });
        if(!this.cell.sheetstable.element.parentElement.contains(this.selecte_conten)){
            this.cell.sheetstable.element.parentElement.appendChild(this.selecte_conten);
            this.cell.sheetstable.element.addEventListener('scroll',this.scrol_padre_elemen);
        }
    }

    InputCreate(){
        this.CreateList(this.rawdata.list.map((item,i)=>{return {'value':item,'index':i}}));
        return this.selecte_conten;
    }

    InputRemove(){
        if(this.selecte_conten){
            this.selecte_conten.remove();
            this.selecte_conten=null;
        }
        this.cell.sheetstable.element.addEventListener('scroll',this.scrol_padre_elemen);
    }

    Serializacion(value){
        const patron = /(?<text>\".*\")|(?<rango>\-?[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+)|(?<cell>\-?[A-Z]{1,3}\d+)|(?<numero>\-?\d+\.\d+)|(?<entero>-?\d+)/g;
        let textoserializar=value.replace(/=List|\(|\)|\[|\]/g,'');
        this.rawdata.list=[];
        this.rawdata.scope={};
        let resultado=patron.exec(textoserializar);
        
        let functiones={'cell':this.#ToListCell.bind(this),'entero':this.#ToListData.bind(this),'numero':this.#ToListData.bind(this),'text':this.#ToListData.bind(this),'rango':this.#ToListRange.bind(this)};
        
        while(resultado){
            Object.keys(resultado.groups).forEach(key=>{
                if(resultado.groups[key]){
                    functiones[key](resultado.groups[key]);
                }
            });
            resultado=patron.exec(textoserializar);
        }
        this.cell.value=0;
        return true;
    }
    #Loadscope(){
        Object.keys(this.rawdata.scope).forEach(address=>{
            this.cell.sheetstable.Cells(address).detEvent('change',this.Cell_Update_event);
            this.cell.sheetstable.Cells(address).addEvent('change',this.Cell_Update_event);
        });
    }

    #ToListRange(RangeString){
        if(!RangeString){
            return;
        }
        let mult=1;
        let range=RangeString;
        if(RangeString[0]=='-'){
            mult=-1;
            range=RangeString.slice(1);
        }
        this.cell.sheetstable.Cells(RangeString).flat().forEach(cell=>{
            this.rawdata.list.push(((typeof cell.value)=='number')? cell.value*mult : cell.value);
            if(!this.rawdata.scope[cell.address]){
                this.rawdata.scope[cell.address]=[];
                cell.addEvent('change',this.Cell_Update_event);
            }
            this.rawdata.scope[cell.address].push({index:this.rawdata.list.length-1,mult:mult,rango:range});
        });
    }

    #ToListCell(CellString){
        if(!CellString){
            return;
        }

        let scope_item={mult:1};
        let cell_str=CellString;
        if(CellString[0]=='-'){
            scope_item.mult=-1;
            cell_str=CellString.slice(1);
        }
        let cell=this.cell.sheetstable.Cells(cell_str);
        this.rawdata.list.push(((typeof cell.value)=='number')? cell.value*scope_item.mult : cell.value);
        scope_item['index']=this.rawdata.list.length-1;
        if(!this.rawdata.scope[cell_str]){
            this.rawdata.scope[cell_str]=[];
            cell.addEvent('change',this.Cell_Update_event);
        }
        this.rawdata.scope[cell_str].push(scope_item);
    }

    #ToListData(data){
        if(!data){
            return;
        }
        this.rawdata.list.push(this.#CheckItemType(data.replace(/\"/mg,'')));
    }

    #CheckItemType(value){
        if(value==='' || isNaN(Number(value))){
            return value;
        }else{
            return Number(value);
        }
    }

    #CellEventUpdate(event){
        if(this.cell.widgets!=this || !this.rawdata.scope[event.cell]){
            event.target.detEvent(event.event,this.Cell_Update_event);
            return;
        }
        this.rawdata.scope[event.cell].forEach(scop=>{
            this.rawdata.list[scop.index]=((typeof event.target.value)=='number')? event.target.value*scop.mult : event.target.value;
            if(this.rawdata.index==scop.index){
                this.value=scop.index;
            }
        });
        
    }
}

class SheetsWidgetCellFunction extends SheetsWidgetCellText{
    constructor({sheetcell=null,data={}}){
        super({sheetcell:sheetcell,data:data});

        this.rawdata=Object.assign({type:'Function', value:'',index:0,cellsEvents:{},scope:{},rawvalue:0},data);
        this.cell.type='Function';
        this.exprecion='';
        this.formula='';
        this.ecuation_document=null;
        this.selecte_conten=null;
        this.promise = Promise.resolve();
        this.compile=null;
        if(this.cell.input){
            this.GetScope();
        }

        if(this.rawdata.cellsEvents!={}){
            this.#Loadscope();
        }

        this.Cell_Update_event=(event)=>{
            this.#CellEventUpdate(event);
        }

        this.scrol_padre_elemen=(event)=>{
            this.UpdateConten();
        };
    }

    #Loadscope(){
        Object.keys(this.rawdata.cellsEvents).forEach(key=>{
            let grupo = this.rawdata.cellsEvents[key];
            grupo[0].cell.detEvent('change',this.Cell_Update_event);
            grupo[0].cell.addEvent('change',this.Cell_Update_event);
        });
    }
    #RemoveEvents(){
        Object.keys(this.rawdata.cellsEvents).forEach(key=>{
            let grupo = this.rawdata.cellsEvents[key];
            grupo[0].cell.detEvent('change',this.Cell_Update_event);
        });
    }

    GetScope(){
        this.rawdata.scope={};
        this.#RemoveEvents();
        this.rawdata.cellsEvents={};
        this.cell.input.cellsintext.forEach(selec=>{
            if(!selec.result.includes(':')){
                let cell=selec.selector.cell;
                this.rawdata.scope[cell.address]=(cell.type=='Function')? cell.widgets.rawdata.rawvalue: cell.value;
                if(!this.rawdata.cellsEvents[cell.address]){
                    this.rawdata.cellsEvents[cell.address]=[];
                    cell.addEvent('change',this.Cell_Update_event);
                }
                this.rawdata.cellsEvents[cell.address].push({rango:false,cell:cell});
            }else{
                this.rawdata.scope[selec.selector.dataset['seleccions'].replace(':','_')]=math.matrix(selec.selector.cellselects.map((row,k)=>{
                    return row.map((cell,j)=>{
                        if(!this.rawdata.cellsEvents[cell.address]){
                            this.rawdata.cellsEvents[cell.address]=[];
                            cell.addEvent('change',this.Cell_Update_event);
                        }
                        this.rawdata.cellsEvents[cell.address].push({rango:selec.selector.dataset['seleccions'].replace(':','_'),index:[k,j],cell:cell});
                        return (cell.type=='Function')? cell.widgets.rawdata.rawvalue: cell.value;
                    });
                }));
            }
        });
    }

    CheckTypeValue(value){
        if(value[0]!='='){
            this.#RemoveEvents();
            this.InputRemove();
            this.cell.widgets=new SheetsWidgetCellText({sheetcell:this.cell});
            return false;
        }
        const funcionpatron=/^\=(?:(?:\.)?(?:[\+\-\*\/\^])?(?:[\(\[]+)?(?:[A-Z]+(?:[\(])|[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+|[A-Z]{1,3}\d+|\d+\.\d+|\d+|\".*\")(?:[\)\]]+)?(?:[\,])?(?:[\)\]]+)?)+$/;
        if(!funcionpatron.test(value)){
           return false; 
        }
        this.formula=[...new Set(value.slice(1).match(/[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+/g))].reduce((t,a)=>t.replace(new RegExp(a,'g'),`${a.replace(':','_')}`),value.slice(1)).replace(/\//g,'./').replace(/\*/,'.*');
        this.formula=[...new Set(this.formula.match(/\"[a-zA-Z0-9\*\/\^\.]+\"/g))].reduce((t,a)=>t.replace(new RegExp(a,'g'),`${a.replace(/\.\//mg,'/')}`),this.formula);

        this.compile=math.compile(this.formula);
        this.Calcular();
        return false;
    }
    Calcular(){
        this.rawdata.rawvalue=this.compile.evaluate(this.rawdata.scope);
        console.log(this.rawdata.rawvalue);
        if(math.typeOf(this.rawdata.rawvalue)=='number'){
            this.rawdata.value=this.rawdata.rawvalue;
            this.rawdata.textalign='end';
            this.cell.dataset['type']='Text';
        }else if(math.typeOf(this.rawdata.rawvalue)=='Unit'){
            this.ValueUnit(this.rawdata.rawvalue);
        }
        //this.rawdata.value=this.compile.evaluate(this.rawdata.scope);
        this.DisplayText();
    }

    ValueMatrix(rawvalue){

    }

    ValueUnit(rawvalue){
        this.cell.dataset['unit']=rawvalue.formatUnits().replace(/ /g,'');
        this.rawdata.textalign='left';
        this.rawdata.value=rawvalue.toNumber();
        this.cell.dataset['type']='Unit';
    }

    get latexExprecion(){
        let latex = math.parse(this.exprecion).toTex();
        return math.parse(this.exprecion).toTex();
    }

    RenderLatex(){
        if(!this.ecuation_document){
            return null;
        }
        let latex='';
        try{
            latex=this.latexExprecion;
        }catch{
            return;
        }
        this.typeset_latex(() => {
            this.ecuation_document.innerHTML = '$$'+latex+'$$';
            return [this.ecuation_document];
        });
    }

    UpdateConten(){
        if(this.selecte_conten){
            this.selecte_conten.style.left=this.cell.getBoundingClientRect().x+'px';
            this.selecte_conten.style.top=(this.cell.getBoundingClientRect().y+this.cell.getBoundingClientRect().height+5)+'px';
        }
    }

    CreateVisualEquation(){
        if(!this.selecte_conten){
            this.selecte_conten=document.createElement('div');
            this.selecte_conten.className='table-sheets-list-box-selectro-contenedor';
            this.selecte_conten.style.setProperty('--color-primario',this.cell.sheetstable.opcions.colorprimario);
            this.UpdateConten();
        }
        this.selecte_conten.innerHTML='';
        if(!this.ecuation_documen){
            this.ecuation_document = document.createElement('div');
            this.ecuation_document.className='Sheet-table-equation-latex-contenedor';
        }
        this.selecte_conten.appendChild(this.ecuation_document);
        if(!this.cell.sheetstable.element.parentElement.contains(this.selecte_conten)){
            this.cell.sheetstable.element.parentElement.appendChild(this.selecte_conten);
            this.cell.sheetstable.element.addEventListener('scroll',this.scrol_padre_elemen);
        }
        return this.ecuation_document;
    }

    Inputclick(){
        if(this.cell.input){
            this.cell.input.select();
            this.cell.input.value='='+this.exprecion;
            this.cell.input.CellTextUpdate();
            this.GetScope();
            this.RenderLatex();
        }
    }

    InputCreate(){
        this.CreateVisualEquation();
    }
    InputRemove(){
        if(this.selecte_conten){
            this.selecte_conten.remove();
        }
        return null;
    }

    Inpuntkey(event){
        if(!this.cell.input.value){
            return null;
        }
        this.GetScope();
        this.exprecion=this.cell.input.value.slice(1);
        this.RenderLatex();
        this.cell.sheetstable.cell_str=true;
    }
    typeset_latex(code) {
        this.promise = this.promise.then(() => MathJax.typesetPromise(code())).catch((err) => console.log('Typeset failed: ' + err.message));
        return this.promise;
    }

    #CellEventUpdate(event){
        if(this.cell.widgets!=this || !this.rawdata.cellsEvents[event.cell]){
            event.target.detEvent(event.event,this.Cell_Update_event);
            return;
        }
        this.rawdata.cellsEvents[event.cell].forEach(grup=>{
            if(grup.rango){
                this.rawdata.scope[grup.rango]._data[grup.index[0]][grup.index[1]]=(event.target.type=='Function')? event.target.widgets.rawdata.rawvalue: event.target.value;
            }else{
                this.rawdata.scope[event.cell]=(event.target.type=='Function')? event.target.widgets.rawdata.rawvalue: event.target.value;
            }
        });
        this.Calcular();
    }
}
function columnaindex(columIndex){
    const abc="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(columIndex<abc.length){
        return abc[columIndex];
    }else{
        return columnaindex(parseInt((columIndex-abc.length)/abc.length))+columnaindex(columIndex-(abc.length*(parseInt((columIndex-abc.length)/abc.length)+1)));
    }
}

function indextocolum(columna) {
    const abc = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25};

    // Convertir la cadena de columna a mayúsculas
    columna = columna.toUpperCase();

    return columna.split('').reduce((indice, char) => {
        const charIndex = abc[char];
        return indice * 26 + charIndex;
    }, 0);
}

function check_mouse_element(event,typeElemet){
    for(let element of document.elementsFromPoint(event.clientX, event.clientY)){
        if(element instanceof typeElemet){
            return element;
        }
    }
    return null;
}

function colorsecuencia(index){
    let colors=[[216, 17, 89], [6, 214, 160], [17, 138, 178], [7, 59, 76],[109, 89, 122],[53, 80, 112]];
    return `rgb(${colors[index%colors.length][0]},${colors[index%colors.length][1]},${colors[index%colors.length][2]})`;
}

customElements.define('sheets-colum', SheetsColum, { extends: 'td' });
customElements.define('sheets-cell', SheetsCell, { extends: 'td' });
customElements.define('sheets-rows', SheetsRow, { extends: 'tr' });
customElements.define('sheets-input', SheetsInput, { extends: 'input' });
customElements.define('sheets-selector', SheetsSelector, { extends: 'div' });

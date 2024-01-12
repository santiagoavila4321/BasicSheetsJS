
//dATA LIMPIA DEL WIDGET TEXT   
const RAW_DATA_TEXT ={
    type:'Text',
    value:'',
    color:'#FFFFFF',
    fonsize:null,
    textalign:'center',
    digits:2,
    notation:'fixed',
    typeText:'Text',
    DisplayText:'',
    textedit:false,
    formato:'',
    error:'',
}


//Patrones de funciones
const PATRON_UNIDAD = /(?:\s(?:(?:[\(]+)?(?:(?:[a-zA-Z]+|\d+\.\d+|\d+)+)(?:[\)]+)?[\/\*\^]?)+)/g
const PATRON_STRING = /(?:[\s\,\(\[]\".*\"[\s\,\)\]])/g;
const PATRON_NUMERIC=/(?:\d+\.\d+|\d+)/g;
const PATRON_VARIABLES=/(?:[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+|[A-Z]{1,3}\d+)/g;
const PATRON_ARIMETICOS=/(?:[\+\-\*\/\^\(\[\,\]\)])/g;

const MATRIXFUNTION=(x,a,f)=>{
    if(math.typeOf(x)=='DenseMatrix'){
        if(math.typeOf(a)=='DenseMatrix'){
            if((x.size()[0]==a.size()[0] && x.size()[1]==a.size()[1])){
                return x.map((i,k)=>{
                    return f(i,a.get(k));
                });
            }else{
                throw new Error('Las dimenciones no son iguales '+ x.size() +' != '+ a.size());
            }
        }else{
            return x.map(i=>{
                return f(i,a);
            });
        }
    }
    return f(x,a);
};
const FUNCIONES2=(x,f)=>{
    if(math.typeOf(x)=='DenseMatrix'){
        return x.map(i=>{
            return f(i);
        });
    }
    return f(x);
};

const SHEETS_FUNCTIONS={
    //funciones
    RAIZ:(x)=>{return FUNCIONES2(x,math.sqrt);},
    POW:(x,a)=>{return MATRIXFUNTION(x,a,math.pow);},
    LN:(x)=>{return FUNCIONES2(x,math.log);},
    LOG10:(x)=>{return FUNCIONES2(x,math.log10);},
    LOG:(x,a)=>{return MATRIXFUNTION(x,a,math.log);},
    ABS:(x)=>{return FUNCIONES2(x,math.abs);},

    //Trigonometria
    COS:(x)=>{return FUNCIONES2(x,math.cos);},
    SIN: (x)=>{return FUNCIONES2(x,math.sin);},
    TAN: (x)=>{return FUNCIONES2(x,math.tan);},
    COSH:(x)=>{return FUNCIONES2(x,math.cosh);},
    SINH: (x)=>{return FUNCIONES2(x,math.sinh);},
    TANH: (x)=>{return FUNCIONES2(x,math.tanh);},

    //ESTADISTICOS
    SUM:(x)=>{return math.sum(x);},
    PROD:(x)=>{return math.prod(x);},
    INDEX:(mx,i,j)=>{return mx.get([i-1,j-1]);},
    MAX:(x)=>{return math.max(x);},
    MIN:(x)=>{return math.min(x);},
    PROMEDIO:(x)=>{return math.mean(x)},
    PROMEDIOPON:(x,a)=>{
        return math.dot(x, a)/math.sum(x);
    },

};

SHEETS_FUNCTIONS.RAIZ.toTex='\\sqrt{${args}}';
SHEETS_FUNCTIONS.POW.toTex='${args[0]}^{${args[1]}}';
SHEETS_FUNCTIONS.LN.toTex='\\ln{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.LOG10.toTex='\\log_{10}{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.LOG.toTex='\\log_{${args[1]}}{\\left(${args[0]}\\right)}';
SHEETS_FUNCTIONS.ABS.toTex='\\left|${args}\\right|';

SHEETS_FUNCTIONS.COS.toTex='\\cos{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.SIN.toTex='\\sin{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.TAN.toTex='\\tan{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.COSH.toTex='\\cosh{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.SINH.toTex='\\sinh{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.TANH.toTex='\\tanh{\\left(${args}\\right)}';

SHEETS_FUNCTIONS.SUM.toTex='\\sum{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.PROD.toTex='\\prod{\\left(${args}\\right)}';
SHEETS_FUNCTIONS.INDEX.toTex='\\text{${args[0]}}_{${args[1]},${args[2]}}';
SHEETS_FUNCTIONS.MAX.toTex='\\text{max}\\left(${args}\\right)';
SHEETS_FUNCTIONS.MIN.toTex='\\text{min}\\left(${args}\\right)';
SHEETS_FUNCTIONS.PROMEDIO.toTex='\\text{promedio}\\left(${args}\\right)';



math.import(SHEETS_FUNCTIONS);



class SheetsTable{
    _mousemove=false;
    _cellselect=null;
    constructor({element,opcions={},data=null}){
        element.innerHTML='';
        //Creador de elementos
        //Elmento contenedor
        this.element=document.createElement('div');
        this.element.className='table-conten-sheets';

        //Elemento input editor superior
        this.superiorinput=new SheetEditoInput({sheetstable:this});
        this.element.appendChild(this.superiorinput);

        //Elemento tabla
        this.table=document.createElement('table');
        this.table.className='table-object-sheets';
        this.table.appendChild(document.createElement('thead'));
        this.table.appendChild(document.createElement('tbody'));
        this.TableHead.appendChild(document.createElement('td'));
        this.element.appendChild(this.table);

        //Contenedror de de los elemento selectores
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
                    invocacion:/^-List\(((?<rango>[A-z]{1,3}\d+\:[A-z]{1,3}\d+)|(?<lista>(\[-?(\d+\.\d+|\d+|[A-Z]{1,3}\d+|"([^"]*)"|[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+)(,-?(\d+\.\d+|\d+|[A-Z]{1,3}\d+|"([^"]*)"|[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+))*\])))\)$/,
                    widgets: SheetsWidgetCellList
                },{
                    type:'Function',
                    invocacion:/^\=.+$/,
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
        this.onMoveSelect=(element)=>{
            return null;
        };

        this.onCellSelect=(cell)=>{
            return null;
        }


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
        this.TableBody.addEventListener('focus', ()=>{null});
        this.TableBody.addEventListener('blur', ()=>{this._mousemove=false;});
        document.addEventListener('keydown',this.keydown);
        document.addEventListener('keyup',this.keyup);


        //cargar data
        if(data!==null){
            this.DataFrame=data;
        }

        this.element.addEventListener('paste', this.#Pase_event.bind(this));

        //Asignamos al elmento madre
        element.classList.add('tabla-sheet-contendero-padre');
        element.appendChild(this.element);
    }

    //cuando se cambia la celda seleccionada
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

    set DataFrame(data){
        Object.keys(data).forEach((key,k)=>{
            if(k>=this.TableHead.childNodes.length-1){
                this.addColum();
            }
            this.TableHead.childNodes[k+1].name=key;
            this.TableHead.childNodes[k+1].modific=false;
            data[key].forEach((d,r)=>{
                if(r>=this.Rows.length){
                    this.addRow();
                }
                this.Cells([r,k]).value=d;
            });
        });
    }
    
    ToArray(formato=true){
        let data=[];

        for(let row of this.Rows){
            let row_data=[];
            for(let cell of row.querySelectorAll('td:not(:first-child)')){
                row_data.push(cell.widgets.rawdata);
            }
            data.push(row_data);
        }

        return data;
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
                return this.#selecs_cels(this.Rows[range[0][0]].childNodes[range[0][1]+1],this.Rows[range[1][0]].childNodes[range[1][1]+1]);
            
            //Buscamos por coorenadas [2 , 4]
            }else if((typeof range[0])=='number'){
                return this.Rows[range[0]].childNodes[range[1]+1];
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
            return false;
        }
        if(!index){
            index=this.Columns.length-1;
        }
        this.Columns[index].remove();
        this.#UpdateIndexColum(index,0);

        return true;
    }

    addColum(index){
        if(!this.opcions.addcolumns){
            return false;
        }

        let colums=this.Columns;
        if(!index){
            index=colums.length;
        }
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
        
        index=(index || this.Rows.length-1);

        this.#UpdateIndexRows(index,-1);
        this.Rows[index].remove();
        return true;
    }

    addRow(index){
        if(!this.opcions.addrows){
            return false;
        }
        index=(index || this.Rows.length);
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
        return true;
    }

    WidgetsCellsDifine(type,invocacion,widgets){
        this.SheetWidgetsCells.splace(0,0,{type:type,invocacion:invocacion,widgets: widgets});
        return this.SheetWidgetsCells[0];
    }

    remove(){
        Array.from(this.table.querySelectorAll('td[class="table-sheets-celda"]')).forEach(cell=>{
            cell.remove();
        });
        document.removeEventListener('keydown',this.keydown);
        document.removeEventListener('keyup',this.keyup);
        this.element.remove();
    }

    #Pase_event(event){
        let selectors = this.element.querySelectorAll('.tabla-sheet-seleccion');
        if(!selectors){
            return;
        }
        if(selectors.length>1){
            return;
        }
        if(event.target==selectors[0].inputElemeto){
            event.preventDefault();

            const types=event.clipboardData.types;
            console.log(types);
            if(types.includes('application/x-vnd.google-docs-embedded-grid_range_clip+wrapped')){
                let data = event.clipboardData.getData('application/x-vnd.google-docs-embedded-grid_range_clip+wrapped');
                data = JSON.parse(data);
                data = JSON.parse(data.data);
                
                // Crear un elemento div para contener la tabla y analizar el HTML
                let divTemporal = document.createElement('div');
                divTemporal.innerHTML = data.grh;
                let tabla = divTemporal.querySelector('table');
                let arrayDatos = [];
                tabla.querySelectorAll('tr').forEach((fila,i)=> {
                    let datosFila = [];
                    fila.querySelectorAll('td').forEach((celda,j)=> {
                        const valor = celda.getAttribute('data-sheets-value');
                        const rawdata={
                            textalign:(celda.style.textAlign=='')? 'left': celda.style.textAlign,
                            textedit:true,
                            type:'Text',
                            color:(celda.style['background-color']=='')? '#FFFFFF': celda.style['background-color'],
                        }
                        try {
                            let valorforamat =(valor!='')? JSON.parse(valor):{};
                            let formato = (celda.getAttribute('data-sheets-numberformat')=='')? null: JSON.parse(celda.getAttribute('data-sheets-numberformat'));
                            if(formato){
                                rawdata['formato']= formato[2];
                            }
                            rawdata['value']=(celda.getAttribute('data-sheets-value')==null)? '': valorforamat[valorforamat[1]];
                        } catch (error) {
                            console.error(error);
                            rawdata['value']='';
                        }
                        datosFila.push(rawdata);
                        Object.assign(this.Cells([this.cellselect.row+i,this.cellselect.colum+j]).widgets.rawdata,rawdata);
                        this.Cells([this.cellselect.row+i,this.cellselect.colum+j]).widgets.DisplayText();
                    });
                    arrayDatos.push(datosFila);
                });

                console.log(arrayDatos);
            }
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

        if(event.button==0){
            let selector = this.element.querySelector('.tabla-sheet-seleccion');
            if(selector){
                this._mousemove=false;
                selector.move=false;
                if(!selector.cell.input){
                    selector.inputElemeto.focus();
                }
            }
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
                this.onMoveSelect(this.cellselect.inputconten);
            }
        }
    }

    //keys events
    #key_up(event){
        if(!this.inputelement){
            this.ctrl_clikc=event.ctrlKey;
        }else{
            this.inputelement.cell.widgets.Inpuntkey(event);
            if(!this.superiorinput.activo){
                this.superiorinput.inputeditor.value=this.inputelement.value;
                this.superiorinput.InputChang(null);
            }
        }
    }
    #key_down(event){
        if(!this.inputelement){
            this.ctrl_clikc=event.ctrlKey;
        }
        if(event.shiftKey){
            if(this.#Arrow_press(event.key)){
                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }
        if(event.key==='Escape'){
            this.ctrl_clikc=false;
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

class SheetEditoInput extends HTMLDivElement{
    constructor({sheetstable=null}){
        super();
        
        this.sheetstable=sheetstable;
        this.activo=false;

        this.className='table-sheets-editor-input';
        this.functionBoton=document.createElement('div');
        this.functionBoton.className='table-sheets-function-boton';
        this.functionBoton.innerHTML='<svg viewBox="0 0 142.51 142.51"><path d="M34.367 142.51c11.645 0 17.827-10.4 19.645-16.544.029-.097.056-.196.081-.297 4.236-17.545 10.984-45.353 15.983-65.58h17.886a6.09 6.09 0 100-12.18H73.103c1.6-6.373 2.771-10.912 3.232-12.461l.512-1.734c1.888-6.443 6.309-21.535 13.146-21.535 6.34 0 7.285 9.764 7.328 10.236.27 3.343 3.186 5.868 6.537 5.579a6.089 6.089 0 005.605-6.539c-.569-7.423-5.376-21.459-19.472-21.459-15.961 0-21.953 20.458-24.832 30.292l-.49 1.659c-.585 1.946-2.12 7.942-4.122 15.962H39.239c-3.364 0-6.09 2.726-6.09 6.09s2.726 6.09 6.09 6.09H57.53c-6.253 25.362-14.334 58.815-15.223 62.498-.332.965-2.829 7.742-7.937 7.742-7.8 0-11.177-10.948-11.204-11.03a6.083 6.083 0 00-7.544-4.156 6.092 6.092 0 00-4.156 7.545c2.131 7.361 9.35 19.822 22.901 19.822zM124.68 126.81c3.589 0 6.605-2.549 6.605-6.607 0-1.885-.754-3.586-2.359-5.474l-12.646-14.534 12.271-14.346c1.132-1.416 1.98-2.926 1.98-4.908 0-3.59-2.927-6.231-6.703-6.231-2.547 0-4.527 1.604-6.229 3.684l-9.531 12.454-9.343-12.456c-1.89-2.357-3.869-3.682-6.7-3.682-3.59 0-6.607 2.551-6.607 6.609 0 1.885.756 3.586 2.357 5.471l11.799 13.592-12.932 15.289c-1.227 1.416-1.98 2.926-1.98 4.908 0 3.589 2.926 6.229 6.699 6.229 2.549 0 4.53-1.604 6.229-3.682l10.19-13.4 10.193 13.4c1.894 2.363 3.876 3.684 6.707 3.684z"/></svg>';
        this.appendChild(this.functionBoton);

        let inputcontenerdor=document.createElement('div');
        inputcontenerdor.className='table-sheets-editor-input-contenedor';
        this.inputback=document.createElement('p');
        this.inputback.className='table-sheets-editor-input-black';
        inputcontenerdor.appendChild(this.inputback);
        this.inputeditor=document.createElement('input');
        inputcontenerdor.appendChild(this.inputeditor);
        this.inputeditor.addEventListener('input',this.InputEvent.bind(this));
        this.inputeditor.addEventListener('mousedown',this.InputClick.bind(this))
        this.inputeditor.addEventListener('focus', ()=>{this.activo=true;});
        this.inputeditor.addEventListener('blur', ()=>{this.activo=false;});
        this.inputeditor.addEventListener('keydown',this.keydown.bind(this));
        this.inputeditor.addEventListener('keypress',this.keypress.bind(this))
        this.appendChild(inputcontenerdor);
    }

    keypress(event){
        if(event.key==='Enter'){
            this.sheetstable.inputelement.cell.widgets.readinput();
            this.sheetstable.ctrl_clikc=false;
            this.sheetstable.deseleccion();
            return;
        }
    }

    keydown(event){
        if(event.key==='Delete'){
            event.stopPropagation();
        }
        if(event.key==='Escape'){
            this.sheetstable.ctrl_clikc=false;
            this.sheetstable.deseleccion();
            return;
        }
    }

    InputEvent(event){
        if(this.sheetstable.inputelement){
            this.InputChang();
            this.sheetstable.inputelement.value=this.inputeditor.value;
            this.sheetstable.inputelement.InputUpdate();
        }else{
            event.preventDefault();
            this.inputeditor.value='';
        }
    }

    set value(val){
        this.inputeditor.value=val;
        this.InputChang();
    }
    get value(){
        return this.inputeditor.value;
    }

    InputChang(){
        if(this.inputeditor.value[0]!='=' && this.inputeditor.value[0]!='-'){
            this.inputback.innerText=this.inputeditor.value;
            return;
        }
        const patron = /\((?:[^()]*)\)/g;
        let text=this.inputeditor.value;
        let result = text.match(patron);
        let index=0;
        let parentesis=[];
        while(result){
            result.forEach(r=>{
                parentesis.splice(0,0,[r,'$_'+index]);
                parentesis.splice(0,0,[r,'$_'+index]);
                text=text.replace(r,'$_'+index);
                index++;
            });
            result = text.match(patron);
        }
        parentesis.forEach((paren,k)=>{
            let tem_tex=`<span style="color:${colorsecuencia(k)}">(</span>`+paren[0].slice(1,-1)+`<span style="color:${colorsecuencia(k)}">)</span>`;
            text=text.replace(paren[1],tem_tex);
        });
        [... new Set(text.match(PATRON_VARIABLES))].forEach((variable,k)=>{
            text=text.replaceAll(variable,`<span style="color:${colorsecuencia(k)}">${variable}</span>`);
        });
        this.inputback.innerHTML=text;
    }

    InputClick(event){
        if(this.sheetstable.inputelement && event.button==0){
            event.stopPropagation();
            //event.preventDefault();
        }
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
    _widget=null;
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
        this.addEventListener('contextmenu',this.ClickMenu.bind(this));

        this.input=null;
        this.Events={};
        this.widgets=new SheetsWidgetCellText({sheetcell:this,data:value});
        this.datatext='';
        this.paragrafelement=null;
        //this.DefaultStylePropertys();
    }

    set widgets(widget){
        if(this._widget){
            this._widget.rawdata.type=this.type;
            this._widget.RemoveWidget();
            widget.rawdata=widget.RawDataChange(widget.rawdata,this._widget.rawdata);
        }
        this._widget=widget;
    }

    get widgets(){
        return this._widget;
    }

    set innerText(val){
        if(val==='' || val ===null || val===undefined){
            super.innerHTML='';
            this.datatext='';
            this.paragrafelement=null;
            return '';
        }
        super.innerHTML='';
        this.paragrafelement=document.createElement('p');
        this.paragrafelement.innerText=val;
        this.paragrafelement.dataset['datatext']=this.datatext;
        this.appendChild(this.paragrafelement);
        return val;
    }

    get innerText(){
        if(this.paragrafelement){
            return this.paragrafelement.innerText;
        }else{
            return '';
        }
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
        if(!funcion){
            return null;
        }
        if(!this.Events[evento]){
            this.Events[evento]=[];
        }
        let existefuntion=false;
        Array.from(this.Events[evento]).forEach((ev,k)=>{
            if(!ev){
                this.Events[evento].splice(k,1);
            }
            if(ev==funcion){
                existefuntion=true;
            }
        });
        if(!existefuntion){
            this.Events[evento].push(funcion);
        }
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
        this.widgets.RemoveWidget();
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
            this.inputconten.UpdateStylePropertys(Cell1,Cell2);
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
            this.inputconten.ElementMove.remove();
            this.inputconten.appendChild(this.input);
            this.widgets.InputCreate();
        }
        return this.input;
    }

    #mouse_down_event(event){
        if(event.button!=0){
            return;
        }
        let cell=check_mouse_element(event,SheetsCell);
        //guarda los datos en la celda y deselecciona
        if(this.sheetstable.cellselect && this.sheetstable.cellselect!=cell && !this.sheetstable.ctrl_clikc){
            this.sheetstable.cellselect.widgets.readinput();
            this.sheetstable.cellselect.select=false;
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
            this.sheetstable.onCellSelect(this);
            event.preventDefault();
        }
        event.stopPropagation();
    }

    #mouse_up_event(event){
        if(event.button!=0){
            return;
        }
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

    ClickMenu(event){
        this.sheetstable.cellselect=this;
        this.CreateSelectorElement();
        event.stopPropagation();
        event.preventDefault();
        DropMenu([event.clientX-5,event.clientY-5],this.#ClicDropMenu());
    }

    #ClicDropMenu(){
        let inputcolor=document.createElement('div');
        inputcolor.className='menu-dropdown-item';
        let color=document.createElement('input');
        color.style='border-block: none;border: none;background: none;';
        color.addEventListener('input',(event)=>{
            this.widgets.rawdata.color=color.value;
            this.widgets.DisplayText();
        });
        let text=document.createElement('label');
        text.innerText='Color';
        inputcolor.appendChild(text);
        inputcolor.appendChild(color);
        color.value=this.widgets.rawdata.color;
        color.setAttribute('type','color');
        inputcolor.addEventListener('click',(event)=>{
            event.stopPropagation();
        });
        let celda=this;
        return [
            [
                {'incon':'bi-copy','text':'Copiar','function':function(event){console.log(this.text);}},
                {'incon':'bi-clipboard-fill','text':'Pegar','function':function(event){pegarDesdePortapapeles();}},
                {'incon':'bi-scissors','text':'Cortar','function':function(event){console.log(this.text);}}
            ],
            [
                {
                    'incon':'bi-123',
                    'text':'Formato',
                    'submenu':[
                        [
                            {'incon':'','text':'Lineal','function':function(event){
                                    celda.widgets.rawdata.notation='fixed';
                                    celda.widgets.DisplayText();
                                }
                            },
                            {'incon':'','text':'Exponencial','function':function(event){
                                    celda.widgets.rawdata.notation='exponential';
                                    celda.widgets.DisplayText();
                                }
                            },
                            {'incon':'','text':'Ingeneria','function':function(event){
                                    celda.widgets.rawdata.notation='engineering';
                                    celda.widgets.DisplayText();
                                }
                            },
                        ]
                    ]
                },
                {
                    incon:'bi-justify',
                    text:'Alineación',
                    'submenu':[
                        [
                            {'incon':'bi-text-left','text':'Izquierda','function':function(event){
                                    celda.widgets.rawdata.textalign='left';
                                    celda.widgets.rawdata.textedit=true;
                                    celda.widgets.StyleUpdate();
                                }
                            },
                            {'incon':'bi-text-center','text':'Centrado','function':function(event){
                                    celda.widgets.rawdata.textalign='center';
                                    celda.widgets.rawdata.textedit=true;
                                    celda.widgets.StyleUpdate();
                                }
                            },
                            {'incon':'bi-text-right','text':'Derecha','function':function(event){
                                    celda.widgets.rawdata.textalign='end';
                                    celda.widgets.rawdata.textedit=true;
                                    celda.widgets.StyleUpdate();
                                }
                            }
                        ]
                    ]
                },
                {
                    'incon':'decimales',
                    'text':'Decimales',
                    'submenu':[
                        [
                            {'incon':'','text':'Añadir decimales','function':function(event){
                                    celda.widgets.rawdata.digits++;
                                    celda.widgets.rawdata.textalign=true;
                                    celda.widgets.DisplayText();
                                    return true;
                                }
                            },
                            {'incon':'','text':'Quitar decimales','function':function(event){
                                    if(celda.widgets.rawdata.digits-1<0){
                                        return true;
                                    }
                                    celda.widgets.rawdata.digits--;
                                    celda.widgets.rawdata.textalign=true;
                                    celda.widgets.DisplayText();
                                    return true;
                                }
                            }
                        ]
                    ]
                }
            ],
            [
                {
                    'incon':'bi-palette-fill',
                    'text':'',
                    'elemento':inputcolor
                }
            ]
        ];
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
            this.sheetstable.TableHead.appendChild(new SheetsColum((Object.keys(Columna).length>0)? Columna: {sheetstable:this.sheetstable,columIndex:k}));
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
    _move=false;
    constructor({sheetcell=null,isCellcreado=true}){
        super();
        this.cell=sheetcell;
        this.isCellcreado=isCellcreado;
        this.className='tabla-sheet-seleccion';
        this.VisulRange=document.createElement('div');

        this.inputElemeto=document.createElement('input');
        this.inputElemeto.style.position='absolute';
        this.inputElemeto.style.top='-100000px';
        this.inputElemeto.style.left='-100000px';
        this.appendChild(this.inputElemeto);
        this.inputElemeto.addEventListener('input',(ev)=>{this.inputElemeto.value=''})

        this.VisulRange.className='tabla-sheet-seleccion-visual-range';
        this.ElementMove=document.createElement('i');
        this.ElementMove.className='bi bi-arrow-down-square-fill';

        if(this.cell.sheetstable.SelectorConten.childNodes.length==0){
            this.color=this.cell.sheetstable.opcions.colorprimario;
        }else{
            this.color=colorsecuencia(this.cell.sheetstable.SelectorConten.childNodes.length-1);
        }
        this.appendChild(this.VisulRange);
        this.appendChild(this.ElementMove);
        this.cell.sheetstable.SelectorConten.appendChild(this);
        this.SelectorVisual=false;
        this.cellselects=[[this.cell]];

        //Identificador de borde solido o con trazos
        this.move=false;
        this.addEventListener('mouseup',this.#Mouseup,true);
        this.addEventListener('mousedown',this.#MouseDown,true);
        this.addEventListener('contextmenu',this.#MouseDropMenu);

        this.ElementMove.addEventListener('mousedown',this.#ElementmoveMouseDown.bind(this),true);

    }

    UpdateStylePropertys(Cell1,Cell2){
        this.style.left=(Cell1.getBoundingClientRect().x- 1 - this.cell.sheetstable.table.getBoundingClientRect().x)+'px';
        this.style.top=(Cell1.getBoundingClientRect().y- 1 - this.cell.sheetstable.table.getBoundingClientRect().y+40)+'px';
        this.style.width=(Cell2.getBoundingClientRect().x - Cell1.getBoundingClientRect().x + Cell2.getBoundingClientRect().width-2)+'px';
        this.style.height=(Cell2.getBoundingClientRect().y - Cell1.getBoundingClientRect().y +  Cell2.getBoundingClientRect().height-3)+'px';
    }
    
    set move(val){
        this.style['transition']=(val)? '0.2s':'-1s';
        return this._move=val;
    }

    get move(){
        return this._move;
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
            this.VisulRange.style.background=`color-mix(in srgb, ${val} 30%, white)`;
            this.ElementMove.style.color=`color-mix(in srgb, ${val} 20%, black)`;
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
        this.VisulRange.innerText=this.dataset['seleccions'];

        if(this.cell.sheetstable.ctrl_clikc && this.cell.sheetstable.inputelement && this.isCellcreado){
            this.InpuAddRange();
            if(this.cell.sheetstable.superiorinput.activo){
                this.cell.sheetstable.superiorinput.InputChang();
                this.cell.sheetstable.inputelement.value=this.cell.sheetstable.superiorinput.value;
            }else{
                this.cell.sheetstable.superiorinput.value=this.cell.sheetstable.inputelement.value;
            }
        }
        
        return this.dataset['seleccions'];
    }

    InpuAddRange(){
        let input=this.cell.sheetstable.inputelement;
        if(this.cell.sheetstable.superiorinput.activo){
            input=this.cell.sheetstable.superiorinput.inputeditor;
        }
        if(input.selectionStart<1 && input.value[0]!='='){
            return;
        }
        this.SelectorVisual=true;
        let selectionStart=input.selectionStart;
        let select=null;

        for(let celltext of this.cell.sheetstable.inputelement.cellsintext){
            if(selectionStart>=celltext.index && selectionStart<=celltext.index+celltext.result.length){
                select=celltext;
                break;
            }
        }

        if(!select){
            let text=input.value.slice(0,selectionStart);
            let test2=input.value.slice(selectionStart);
            input.value=text+this.dataset['seleccions']+test2;

            this.cell.sheetstable.inputelement.cellsintext.forEach(celtext=>{
                if(celtext.index>text.length){
                    celtext.index=celtext.index+text.length;
                }
            });

            this.cell.sheetstable.inputelement.cellsintext.push({index:text.length,result:this.dataset['seleccions'],selector:this});
            input.focus();
            input.setSelectionRange(text.length+this.dataset['seleccions'].length,text.length+this.dataset['seleccions'].length);
            return;
        }
        this.color=select.selector.color;
        let text=input.value.slice(0,select.index);
        let test2=input.value.slice(select.index+select.result.length);
        let disferenacia=this.dataset['seleccions'].length-select.result.length;
        input.value=text+this.dataset['seleccions']+test2;
        select.result=this.dataset['seleccions'];
        this.cell.sheetstable.inputelement.cellsintext.forEach(celtext=>{
            if(celtext.index>select.index){
                celtext.index=celtext.index+disferenacia;
            }
        });
        if(select.selector!=this){select.selector.remove();select.selector=this;}
        //this.cell.sheetstable.inputelement.CellTextUpdate(select);
        input.focus();
        input.setSelectionRange(select.index+this.dataset['seleccions'].length,select.index+this.dataset['seleccions'].length);
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

    #MouseDown(event){
        if(event.button==2){
            event.stopPropagation();
            event.preventDefault();
        }
        if(event.button==0){
            if((this.cell.sheetstable.ctrl_clikc || event.ctrlKey) && !this.SelectorVisual){
                event.stopPropagation();
                this.isCellcreado=false;
            }
        }
    }

    #Mouseup(event){
        if(event.button==0){
            if(event.ctrlKey && !this.isCellcreado && !this.SelectorVisual){
                this.remove();
                event.stopPropagation();
            }
            if(this.move){
                this.move=false;
            }
            if(this.cell.sheetstable.ctrl_clikc && this.cell.sheetstable.inputelement && this.isCellcreado){
                this.cell.sheetstable.inputelement.cell.widgets.Inpuntkey(event);
            }
            this.cell.sheetstable.cellselect2=this._selects.flat().slice(-1)[0];
        }
    }

    #ElementmoveMouseDown(event){
        if(event.button==0){
            if(!this.cell.input){
                this.move=true;
                this.cell.sheetstable._mousemove=true;
                this.isCellcreado=true;
                if(this.cell.sheetstable.cellselect!==this.cell){
                    this.cell.sheetstable.cellselect=this.cell;
                }
                event.stopPropagation();
                event.preventDefault();
            }
        }
    }

    #MouseDropMenu(event){
        event.stopPropagation();
        event.preventDefault();
        DropMenu([event.clientX-5,event.clientY-5],this.#ClicDropMenu());
    }

    #ClicDropMenu(){
        let inputcolor=document.createElement('div');
        inputcolor.className='menu-dropdown-item';
        let color=document.createElement('input');
        color.style='border-block: none;border: none;background: none;';
        color.addEventListener('input',(event)=>{
            this.cellselects.flat().forEach(cell=>{
                cell.widgets.rawdata.color=color.value;
                cell.style.background=color.value;
            });
        });
        let text=document.createElement('label');
        text.innerText='Color';
        inputcolor.appendChild(text);
        inputcolor.appendChild(color);

        // Objeto para almacenar la cuenta de cada color
        let conteoColores = {};

        // Recorre cada elemento y obtén su color
        this.cellselects.flat().forEach(function(elemento) {
            const color = window.getComputedStyle(elemento).getPropertyValue('background-color').replace(/rgb|\(|\)|\s/g, '');
            const [r, g, b] = color.split(',').map(c => parseInt(c));
            const hexColor = rgbToHex([r, g, b]);
            
            // Incrementa la cuenta para ese color en el objeto de conteo
            conteoColores[hexColor] = (conteoColores[hexColor] || 0) + 1;
        });

        // Encuentra el color con la mayor cuenta
        color.value=Object.keys(conteoColores).reduce(function(a, b) {
            return conteoColores[a] > conteoColores[b] ? a : b;
        });
        color.setAttribute('type','color');
        inputcolor.addEventListener('click',(event)=>{
            event.stopPropagation();
        });
        let selector=this;
        return [
            [
                {'incon':'bi-copy','text':'Copiar','function':function(event){console.log(this.text);}},
                {'incon':'bi-clipboard-fill','text':'Pegar','function':function(event){console.log(this.text);}},
                {'incon':'bi-scissors','text':'Cortar','function':function(event){console.log(this.text);}}
            ],
            [
                {
                    'incon':'bi-grid-3x3',
                    'text':'Cuadricula',
                    'submenu':[
                        [
                            {'incon':'bi-border-all','text':'Borde all','function':function(event){
                                    selector.cellselects.forEach((row,i)=>{
                                        row.forEach((cell,k)=>{
                                            if(i==0){
                                                let cel2= cell.sheetstable.Cells([cell.row-1,cell.colum]);
                                                cel2.style['border-bottom-color']='black';
                                            }
                                            if(k==0){
                                                let cel2= cell.sheetstable.Cells([cell.row,cell.colum-1]);
                                                cel2.style['border-right-color']='black';
                                            }
                                            cell.style['border-color']='black';
                                        });
                                    });
                                }
                            },
                            {'incon':'bi-border','text':'No borde','function':function(event){
                                    selector.cellselects.forEach((row,i)=>{
                                        row.forEach((cell,k)=>{
                                            if(i==0){
                                                let cel2= cell.sheetstable.Cells([cell.row-1,cell.colum]);
                                                cel2.style['border-bottom-color']='';
                                            }
                                            if(k==0){
                                                let cel2= cell.sheetstable.Cells([cell.row,cell.colum-1]);
                                                cel2.style['border-right-color']='';
                                            }
                                            cell.style['border-color']='';
                                        });
                                    });
                                }
                            },
                            {'incon':'bi-border-left','text':'Borde Izquierdo','function':function(event){
                                    selector.cellselects.forEach((row,i)=>{
                                        let cel2= row[0].sheetstable.Cells([row[0].row,row[0].colum-1]);
                                        cel2.style['border-right-color']='black';
                                    });
                                }
                            },
                            {'incon':'bi-border-right','text':'Borde Derecho','function':function(event){
                                    selector.cellselects.forEach((row,i)=>{
                                        row[row.length-1].style['border-right-color']='black';
                                    });
                                },
                            },
                            {'incon':'bi-border-top','text':'Borde Superior','function':function(event){
                                    selector.cellselects[0].forEach((cell,i)=>{
                                        let cel2=cell.sheetstable.Cells([cell.row-1,cell.colum]);
                                        cel2.style['border-bottom-color']='black';
                                    });
                                },
                            },
                            {'incon':'bi-border-bottom','text':'Borde Inferior','function':function(event){
                                    selector.cellselects[selector.cellselects.length-1].forEach((cell,i)=>{
                                        cell.style['border-bottom-color']='black';
                                    });
                                },
                            },
                            {'incon':'bi-border-outer','text':'Borde','function':function(event){
                                    selector.cellselects[selector.cellselects.length-1].forEach((cell,i)=>{
                                        cell.style['border-bottom-color']='black';
                                    });
                                    selector.cellselects[0].forEach((cell,i)=>{
                                        let cel2=cell.sheetstable.Cells([cell.row-1,cell.colum]);
                                        cel2.style['border-bottom-color']='black';
                                    });
                                    selector.cellselects.forEach((row,i)=>{
                                        row[row.length-1].style['border-right-color']='black';
                                    });
                                    selector.cellselects.forEach((row,i)=>{
                                        let cel2= row[0].sheetstable.Cells([row[0].row,row[0].colum-1]);
                                        cel2.style['border-right-color']='black';
                                    });
                                },
                            },
                        ]
                    ]
                }
            ],
            [
                {
                    'incon':'bi-123',
                    'text':'Formato',
                    'submenu':[
                        [
                            {'incon':'','text':'Lineal','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        cell.widgets.rawdata.notation='fixed';
                                        cell.widgets.DisplayText();
                                    });
                                }
                            },
                            {'incon':'','text':'Exponencial','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        cell.widgets.rawdata.notation='exponential';
                                        cell.widgets.DisplayText();
                                    });
                                }
                            },
                            {'incon':'','text':'Ingeneria','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        cell.widgets.rawdata.notation='engineering';
                                        cell.widgets.DisplayText();
                                    });
                                }
                            },
                        ]
                    ]
                },
                {
                    incon:'bi-justify',
                    text:'Alineación',
                    'submenu':[
                        [
                            {'incon':'bi-text-left','text':'Izquierda','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        cell.widgets.rawdata.textalign='left';
                                        cell.widgets.rawdata.textedit=true;
                                        cell.widgets.StyleUpdate();
                                    });
                                    
                                }
                            },
                            {'incon':'bi-text-center','text':'Centrado','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        cell.widgets.rawdata.textalign='center';
                                        cell.widgets.rawdata.textedit=true;
                                        cell.widgets.StyleUpdate();
                                    });
                                    
                                }
                            },
                            {'incon':'bi-text-right','text':'Derecha','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        cell.widgets.rawdata.textalign='end';
                                        cell.widgets.rawdata.textedit=true;
                                        cell.widgets.StyleUpdate();
                                    });
                                    
                                }
                            }
                        ]
                    ]
                },
                {
                    'incon':'decimales',
                    'text':'Decimales',
                    'submenu':[
                        [
                            {'incon':'','text':'Añadir decimales','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        cell.widgets.rawdata.digits++;
                                        cell.widgets.rawdata.textedit=true;
                                        cell.widgets.DisplayText();
                                    });
                                    return true;
                                }
                            },
                            {'incon':'','text':'Quitar decimales','function':function(event){
                                    selector.cellselects.flat().forEach(cell=>{
                                        if(cell.widgets.rawdata.digits-1<0){
                                            return true;
                                        }
                                        cell.widgets.rawdata.digits--;
                                        cell.widgets.rawdata.textedit=true;
                                        cell.widgets.DisplayText();
                                        return true;
                                    });
                                }
                            }
                        ]
                    ]
                }
            ],
            [
                {
                    'incon':'bi-palette-fill',
                    'text':'',
                    'elemento':inputcolor
                }
            ]
        ];
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
        this.addEventListener('input',this.Keyinput.bind(this));
        this.addEventListener('contextmenu',(event)=>{
            event.stopPropagation();
        });
        this.cell.sheetstable.inputelement=this;
        this.cellsintext=[];
    }

    set value(val){
        if(!this.cell.sheetstable.superiorinput.activo){
            this.cell.sheetstable.superiorinput.value=val;
        }
        return super.value=val;
    }

    get value(){
        return super.value;
    }

    remove(){
        this.cell.sheetstable.inputelement=null;
        this.cell.widgets.InputRemove();
        this.cell.sheetstable.superiorinput.value='';
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
        const patron=PATRON_VARIABLES;
        let resultado=patron.exec(this.value);
        this.cellsintext=[];
        while(resultado){
            let selector=null;
            let objectoText={};
            if(resultado[0].includes(':')){
                let cells=this.cell.sheetstable.Cells(resultado[0].split(':')[0]);

                if(!cells){
                    return null;
                }
                if(cells!=this.cell){
                    cells.CreateSelectorElement(false);
                    selector=cells.inputconten;
                    selector.cellselects=this.cell.sheetstable.Cells(resultado[0]);
                }
            }else{
                let cells=this.cell.sheetstable.Cells(resultado[0].split(':')[0]);

                if(!cells){
                    return null;
                }
                if(cells!=this.cell){
                    cells.CreateSelectorElement(false);
                    selector=cells.inputconten;
                }
            }
            if(selector!==null){
                selector.SelectorVisual=true;
                selector={index:resultado.index,result:resultado[0],selector:selector};
                this.cellsintext.push(selector);
            }
            resultado=patron.exec(this.value);
        }
        return this.cellsintext;
    }

    InputUpdate(){
        this.deseleccion();
        if(this.value[0]=='=' || this.value[0]=='-'){
            this.CellTextUpdate();
            if(!this.cell.sheetstable.ctrl_clikc){
                this.cell.sheetstable.ctrl_clikc=true;
            }
        }else{
            if(this.cell.sheetstable.ctrl_clikc){
                this.cell.sheetstable.ctrl_clikc=false;
            }
        }
        this.cell.widgets.Inpuntkey(event);
    }

    Keyinput(event){
        this.InputUpdate();
    }
}


// Widget para las Celdas
class SheetsWidgetCellText{
    constructor({sheetcell=null,data={}}){
        this.rawdata=Object.assign({},RAW_DATA_TEXT);
        this.cell=sheetcell;
        this.cell.type='Text';
        if(Object.keys(data).length>0){
            this.data=data;
        }
        this.typeText='Text';
    }

    set typeText(val){
        this.cell.dataset['type']=val;
        this.rawdata.typeText=val;
    }

    get typeText(){
        return this.rawdata.typeText;
    }

    set data(rawdata){
        if(rawdata.type!=this.cell.type){
            for(let widgetType of this.cell.sheetstable.SheetWidgetsCells){

                if(widgetType.type==rawdata.type){

                    if(!(this instanceof widgetType.widgets) || widgetType.type=='Text'){
                        this.cell.widgets=new widgetType.widgets({
                            sheetcell:this.cell
                        });
                    }
                    return;
                }
            }
        }
        this.rawdata=this.RawDataChange(this.rawdata,rawdata);
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

    RawDataChange(prototype,data){
        let dataprototype={};
        Object.keys(prototype).forEach(key=>{
            if(data[key]){
                dataprototype[key]=data[key];
            }else{
                dataprototype[key]=prototype[key];
            }
        });
        return dataprototype;
    }

    readinput(){
        if(this.cell.input){
            this.value=this.cell.input.value;
        }
    }

    StyleUpdate(){
        if(this.rawdata.fonsize && this.cell.style['font-size']!=this.rawdata.fonsize+'px'){
            this.cell.style['font-size']=this.rawdata.fonsize+'px';
        }

        if(this.rawdata.color && this.cell.style['background']!=this.rawdata.color){
            this.cell.style['background']=this.rawdata.color;
        }

        if(this.cell.paragrafelement && this.rawdata.textalign && this.cell.paragrafelement.style['justify-content']!=this.rawdata.textalign){
            this.cell.paragrafelement.style['justify-content']=this.rawdata.textalign;
        }
    }

    ErrorCalc(error,textdisplay='#REF'){
        this.rawdata.rawvalue=null;
        this.rawdata.value=textdisplay;
        this.rawdata.error=error;
        this.rawdata.textalign='center';
        this.typeText='Text';
        this.DisplayText();
        this.rawdata.value=null;
        console.error(error);
    }

    NumeroFormat(num,digits=2,notation='fixed'){
        if(this.rawdata.formato !=''){
            const result = this.rawdata.formato.match(/\[\$(?<moneda>.)\]/);
            if(result){
                this.cell.datatext=result.groups.moneda;
                this.typeText='Moneda';
            }
            return numeral(num).format(this.rawdata.formato);
        }
        if(math.typeOf(num)=='string'){
            return num;
        }
        let valor=num;
        if(math.typeOf(valor)=='Unit'){
            valor=num.toNumeric();
        }
        return math.format(valor, (value)=>{
            return math.format(value,  {notation: notation, precision: digits});
        });
    }

    TextTypeCheck(value){
        let data=[0,'end','Text','',false];
        if(Number.isNaN(value)){
            data[0]='center';
            data[0]='#NaN';
            data[4]=true;
            return data;
        }
        if(math.typeOf(value)=='number'){
            data[0]=value;
            data[2]=(!this.IsEntero(value))? 'Numero': 'Entero';
            data[1]='end';
            data[4]=true;
            return data;
        }
        if(math.typeOf(value)=='Unit'){
            return this.ValueUnit(value);
        }
        if(math.typeOf(value)=='Complex'){
            return this.ValueComplex(value);
        }
        if(math.typeOf(value)=='string'){
            data[0]=value;
            data[1]='center';
            data[4]=true;
            return data;
        }
        data[0]='#NAME';
        data[1]='center';
        data[4]=true;
        return data;
    }

    ValueComplex(rawvalue){
        let data=[rawvalue,'end','Complex','',false];
        return data;
    }

    ValueUnit(rawvalue){
        let data=[0,'space-between','Unit','',false];
        data[3]=rawvalue.formatUnits().replace(/\s\/\s/g,'/').replace(/ /g,'*').replace(/deg/g,'°');
        data[0]=rawvalue;
        return data;
    }

    DisplayText(){
        let datastyle=this.TextTypeCheck(this.rawdata.value);
        this.cell.datatext=datastyle[3];
        this.rawdata.value=datastyle[0];
        this.typeText=datastyle[2];
        this.rawdata.textalign=(datastyle[4] && this.rawdata.textedit)? this.rawdata.textalign: datastyle[1];
        
        this.rawdata.DisplayText=this.rawdata.value;
        let digits=this.rawdata.digits;
        if(this.rawdata.typeText=='Entero' && !this.rawdata.textedit){
            digits=0;
        }
        this.rawdata.DisplayText=this.NumeroFormat(this.rawdata.value,digits,this.rawdata.notation);
        this.cell.innerText=this.rawdata.DisplayText;
        this.StyleUpdate();
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
            if(this.rawdata.typeText!='Text'){
                this.rawdata.textalign='center';
            }
            return true;
        }else{
            this.rawdata.value=Number(value);
            if(this.rawdata.typeText=='Numero' || this.rawdata.typeText=='Entero'){
                this.rawdata.textalign='end';
            }
            return true;
        }
    }

    IsEntero(num){
        return math.isInteger(num);
    }

    InputCreate(){
        return null;
    }
    InputRemove(){
        return null;
    }

    Inpuntkey(event){
        if(this.cell.input && this.cell.input.value[0]=='='){
            for(let widgetType of this.cell.sheetstable.SheetWidgetsCells){
                if(widgetType.invocacion.test(this.cell.input.value) && widgetType.type!=this.cell.type){
                    this.cell.widgets=new widgetType.widgets({sheetcell:this.cell});
                    this.cell.widgets.Serializacion(this.cell.input.value);
                    return false;
                }
            }
        }
        return null;
    }

    RemoveWidget(){
        return false;
    }

    #CheckValue(value){
        if(value==='' || value===null || value===undefined || Number.isNaN(value)){
            this.rawdata.value='';
            this.rawdata.DisplayText='';
            if(this.cell.type!='Text' && value!==''){
                this.cell.widgets=new SheetsWidgetCellText({sheetcell:this.cell});
            }
            this.typeText='Text';
            this.rawdata.formato='';
            return true;
        }
        return this.CheckTypeValue(value);
    }
}

class SheetsWidgetCellList extends SheetsWidgetCellText{
    constructor({sheetcell=null,data={}}){
        super({sheetcell:sheetcell,data:data});

        let prototype_rawdata=Object.assign(this.rawdata,{type:'List',list:[''],index:0,scope:{}});
        this.rawdata=this.RawDataChange(prototype_rawdata,data);
        this.cell.type='List';
        this.selecte_conten=null;

        if(this.rawdata.scope=={}){
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

    DisplayText(){
        if(this.rawdata.textalign!='space-between'){
            this.rawdata.textalign='space-between';
        }
        this.rawdata.textedit=true;
        super.DisplayText();
    }

    CheckTypeValue(value){
        if(isNaN(parseInt(value))){
            return false;
        }
        if(value<this.rawdata.list.length){
            this.rawdata.index=value;
            this.rawdata.value=(this.rawdata.list[value])? this.rawdata.list[value]: '-';
            this.rawdata.DisplayText=this.rawdata.list[value];
            if((typeof this.rawdata.value)=='number'){
                this.typeText=(!this.IsEntero(this.rawdata.value))? 'Numero': 'Entero';
            }else{
                this.typeText='Text';
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
            spantext.innerText=((math.typeOf(a.value))=='number' && !this.IsEntero(a.value))? this.NumeroFormat(a.value,2): a.value;
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
        if(!document.body.contains(this.selecte_conten)){
            document.body.appendChild(this.selecte_conten);
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
        this.cell.sheetstable.element.removeEventListener('scroll',this.scrol_padre_elemen);
    }

    RemoveWidget(){
        this.rawdata.textalign='center';
        this.typeText='Text';
        this.cell.sheetstable.element.removeEventListener('scroll',this.scrol_padre_elemen);
        return false;
    }

    Serializacion(value){
        const patron = /(?<text>"([^"]*)")|(?<rango>\-?[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+)|(?<cell>\-?[A-Z]{1,3}\d+)|(?<numero>\-?\d+\.\d+)|(?<entero>-?\d+)/g;
        let textoserializar=value.replace(/-List|\(|\)/g,'');
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
        this.rawdata.list.push(this.#CheckItemType(data.replace(/\"/g,'')));
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
    _ismatrix=false;
    constructor({sheetcell=null,data={}}){
        super({sheetcell:sheetcell,data:data});
        let prototype_rawdata=Object.assign(this.rawdata,{
            type:'Function',
            cellsEvents:{},
            scope:{},
            rawvalue:0,
            exprecion:''
        });
        this.rawdata=this.RawDataChange(prototype_rawdata,data);

        this.cell.type='Function';
        this.exprecion='';
        this.formula='';
        this.ecuation_document=null;
        this.selecte_conten=null;
        this.promise = Promise.resolve();
        this.compile=null;
        this.recurcividad={'existe':false};
        this.ismatrix=false;
        this.matrix_last_cell=null;

        this.#Loadscope();

        this.Cell_Update_event=(event)=>{
            this.#CellEventUpdate(event);
        };

        this.Cell_Update_Matrix=(event)=>{
            this.#CellEventMatrixUpdate(event);
        };

        this.scrol_padre_elemen=(event)=>{
            this.UpdateConten();
        };

        this.OpacityEquation=(event)=>{
            this.VisualEquationOpacity(event);
        };

        if(this.cell.input){
            this.GetScope();
            this.CreateVisualEquation();
        }
    }

    set exprecion(val){
        return this.rawdata.exprecion=val;
    }

    get exprecion(){
        return this.rawdata.exprecion;
    }

    set ismatrix(val){
        if(val){
            if(!this.cell.classList.contains('matrix')){
                this.cell.classList.add('matrix');
            }
            let left=(this.cell.getBoundingClientRect().x- 1 - this.cell.sheetstable.table.getBoundingClientRect().x)+'px';
            let top=(this.cell.getBoundingClientRect().y- 1 - this.cell.sheetstable.table.getBoundingClientRect().y+40)+'px';
            let width=(this.matrix_last_cell.getBoundingClientRect().x - this.cell.getBoundingClientRect().x + this.matrix_last_cell.getBoundingClientRect().width-0.5)+'px';
            let height=(this.matrix_last_cell.getBoundingClientRect().y - this.cell.getBoundingClientRect().y +  this.matrix_last_cell.getBoundingClientRect().height-0.5)+'px';
            this.cell.style.setProperty('--selec-type-with',width);
            this.cell.style.setProperty('--selec-type-height',height);
            this.cell.style.setProperty('--selec-type-top',top);
            this.cell.style.setProperty('--selec-type-left',left);
        }else{
            if(this.cell.classList.contains('matrix')){
                this.cell.classList.remove('matrix');
                this.cell.style.setProperty('--selec-type-with','');
                this.cell.style.setProperty('--selec-type-height','');
                this.cell.style.setProperty('--selec-type-top','');
                this.cell.style.setProperty('--selec-type-left','');
            }
        }
        return this._ismatrix=val;
    }

    get ismatrix(){
        return this._ismatrix;
    }

    #Loadscope(){
        Object.keys(this.rawdata.cellsEvents).forEach(key=>{
            let grupo = this.rawdata.cellsEvents[key];
            grupo[0].cell.detEvent('change',grupo[0].event);
            grupo[0].cell.addEvent('change',grupo[0].event);
        });
    }
    #RemoveEvents(){
        Object.keys(this.rawdata.cellsEvents).forEach(key=>{
            let grupo = this.rawdata.cellsEvents[key];
            grupo[0].cell.detEvent('change',grupo[0].event);

            let isequal=(math.typeOf(grupo[0].value)==math.typeOf(grupo[0].cell.widgets.value)) && math.equal(grupo[0].value,grupo[0].cell.widgets.value);
            if(grupo[0].event==this.Cell_Update_Matrix && grupo[0].cell.type=='Text' && isequal){
                grupo[0].cell.value='';
            }
        });
        this.rawdata.cellsEvents={};
    }

    GetScope(){
        this.rawdata.scope={};
        this.#RemoveEvents();
        let iscelleconten=false;
        let result=this.exprecion.match(PATRON_VARIABLES);
        let tabla=this.cell.sheetstable;
        if(!result){
            return;
        }
        result.forEach(selec=>{
            if(!selec.includes(':')){
                let cell=tabla.Cells(selec);
                if(cell==this.cell){
                    iscelleconten=true;
                    return;
                }
                this.rawdata.scope[cell.address]=(cell.type=='Function' && !cell.widgets.ismatrix)? cell.widgets.rawdata.rawvalue: cell.value;
                if(!this.rawdata.cellsEvents[cell.address]){
                    this.rawdata.cellsEvents[cell.address]=[];
                    cell.addEvent('change',this.Cell_Update_event);
                }
                this.rawdata.cellsEvents[cell.address].push({rango:false,cell:cell,event:this.Cell_Update_event});
            }else{
                this.rawdata.scope[selec.replace(':','_')]=math.matrix(tabla.Cells(selec).map((row,k)=>{
                    return row.map((cell,j)=>{
                        if(cell==this.cell){
                            iscelleconten=true;
                            return;
                        }
                        if(!this.rawdata.cellsEvents[cell.address]){
                            this.rawdata.cellsEvents[cell.address]=[];
                            cell.addEvent('change',this.Cell_Update_event);
                        }
                        this.rawdata.cellsEvents[cell.address].push({rango:selec.replace(':','_'),index:[k,j],cell:cell,event:this.Cell_Update_event});
                        return (cell.type=='Function' && !cell.widgets.ismatrix)? cell.widgets.rawdata.rawvalue: cell.value;
                    });
                }));
            }
        });
        if(iscelleconten){
            this.#RemoveEvents();
            this.rawdata.scope={};
            this.rawdata.scope[this.cell.address]='';
            return; 
        }
    }

    CheckTypeValue(value){
        if(value[0]!='='){
            this.#RemoveEvents();
            this.InputRemove();
            this.cell.widgets=new SheetsWidgetCellText({sheetcell:this.cell});
            return false;
        }
        this.recurcividad=this.Findscope(this.rawdata.scope,this.cell.address);
        if(this.recurcividad.existe){
            this.ErrorCalc('Dependencia circular: No puede contener las misma celda en la formula');
            return false;
        }
        this.formula=[...new Set(value.slice(1).match(/[A-Z]{1,3}\d+\:[A-Z]{1,3}\d+/g))].reduce((t,a)=>t.replace(new RegExp(a,'g'),`${a.replace(':','_')}`),value.slice(1)).replace(/\//g,'./').replace(/\*/,'.*').replace(/\^/g,'.^');

        try {
            this.compile=math.compile(this.formula);
        } catch (error) {
            this.ErrorCalc(error.message);
            return false;
        }
        this.Calcular();
        return false;
    }
    Findscope(scope,address){
        if(!scope){
            return {'existe':false};
        }
        for(let cell_addres of Object.keys(scope)){
            if(cell_addres==address){
                return {'existe':true,'cell':this.cell.sheetstable.Cells(cell_addres)};
            }
            if(cell_addres.includes('_')){
                for(let cell of this.cell.sheetstable.Cells(cell_addres.replace('_',':')).flat()){
                    if(cell.address==address){
                        return {'existe':true,'cell':cell};
                    }
                    let result =this.Findscope(cell.widgets.rawdata.scope,address);
                    if(result.existe){
                        return result;
                    }
                }
                continue;
            }
            let cell = this.cell.sheetstable.Cells(cell_addres);
            let result =this.Findscope(cell.widgets.rawdata.scope,address);
            if(result.existe){
                return result;
            }
        }
        return {'existe':false};
    }
    Calcular(){
        this.ismatrix=false;
        if(this.recurcividad.existe){
            return this.CheckTypeValue('='+this.exprecion);
        }
        try {
            this.rawdata.rawvalue=this.compile.evaluate(this.rawdata.scope);
            if(this.rawdata.rawvalue===null || this.rawdata.rawvalue===undefined){
                throw new Error('Valor nulo o no encontrado');
            }
        } catch (error) {
            this.ErrorCalc(error.message);
            return false;
        }
        this.rawdata.error=false;
        this.rawdata.value=this.rawdata.rawvalue;
        if(math.typeOf(this.rawdata.rawvalue)=='DenseMatrix'){
            this.ValueMatrix(this.rawdata.rawvalue);
        }
        this.DisplayText();
    }

    ValueMatrix(rawvalue){
        let row=this.cell.row;
        let colum=this.cell.colum;
        let size_matrix=rawvalue.size();
        let sheetstable=this.cell.sheetstable;
        if(!(size_matrix[0]+row-1<sheetstable.opcions.rows && size_matrix[1]+colum-1<sheetstable.opcions.columns.length)){
            this.rawdata.value='#DES';
            return;
            //=[[1,2],[2,4]]
        }
        let des=false;
        for(let i=0;i<size_matrix[0];i++){
            for(let k=0;k<size_matrix[1];k++){
                if(i==0 && k==0){
                    continue;
                }
                let cell = sheetstable.Cells([i+row,k+colum]);
                if(i==size_matrix[0]-1 && k==size_matrix[1]-1){
                    this.matrix_last_cell=cell;
                }
                cell.detEvent('change',this.Cell_Update_Matrix);
                let datavalue=rawvalue.get([i,k]);
                if(this.rawdata.cellsEvents[cell.address] && this.rawdata.cellsEvents[cell.address].length>0 && this.rawdata.cellsEvents[cell.address][0].value){
                    datavalue=this.rawdata.cellsEvents[cell.address][0].value;
                }
                let isequal=(math.typeOf(datavalue)==math.typeOf(cell.widgets.value)) && math.equal(datavalue,cell.widgets.value);

                if((cell.type!='Text' || (cell.type=='Text' && (cell.value!='' && ! Number.isNaN(cell.value) && !isequal))) && !des){
                    this.rawdata.value='#DES';
                    des=true;
                    i=0;
                    k=0;
                    continue;
                }
                if(!des){
                    cell.widgets.value=rawvalue.get([i,k]);
                    cell.widgets.DisplayText();
                }else{
                    isequal=(math.typeOf(rawvalue.get([i,k]))==math.typeOf(cell.widgets.value)) && math.equal(rawvalue.get([i,k]),cell.widgets.value);
                    if(cell.type=='Text' && (isequal ||  Number.isNaN(cell.value))){
                        cell.widgets.rawdata.value='';
                        cell.widgets.DisplayText();
                    }
                }
                this.rawdata.cellsEvents[cell.address]=[{rango:false,cell:cell,event:this.Cell_Update_Matrix,i:i,k:k,value:rawvalue.get([i,k])}];
                cell.addEvent('change',this.Cell_Update_Matrix);
            }
        }
        if(!des){
            this.rawdata.value=rawvalue.get([0,0]);
        }
        this.ismatrix=true;
    }

    get latexExprecion(){
        if(this.exprecion!=''){
            let textexprecion=math.parse(this.exprecion.replaceAll(':','_ñ_')).toTex().replaceAll('\\_ñ\\_',':');
            [... new Set(textexprecion.match(PATRON_VARIABLES))].forEach((variable,k)=>{
                textexprecion=textexprecion.replaceAll(variable,`\\textcolor{${colorsecuencia(k)}}{${variable}}`);
            });
            return textexprecion;
        }else{
            return '';
        }
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

    VisualEquationOpacity(event){
        if(!this.selecte_conten){
            this.cell.sheetstable.element.removeEventListener('mousemove',this.OpacityEquation);
        }
        let element = this.selecte_conten;
        let x_m=event.clientX;
        let y_m=event.clientY;
        let x_e=element.getBoundingClientRect().x;
        let y_e=element.getBoundingClientRect().y;
        if(x_m>x_e && x_m<x_e+element.getBoundingClientRect().width && y_m>y_e && y_m<y_e+element.getBoundingClientRect().height && element.style.opacity!='0.5'){
            this.selecte_conten.style.transition='0.2s';
            element.style.opacity='0.4';
        }else if(element.style.opacity=='0.4' && !(x_m>x_e && x_m<x_e+element.getBoundingClientRect().width && y_m>y_e && y_m<y_e+element.getBoundingClientRect().height)){
            element.style.opacity='';
            this.selecte_conten.style.transition='0s';
        }
    }

    RemoveVisualEquation(){
        this.cell.sheetstable.element.removeEventListener('scroll',this.scrol_padre_elemen);
        this.cell.sheetstable.element.removeEventListener('mousemove',this.OpacityEquation);
        if(this.selecte_conten){
            this.selecte_conten.remove();
            this.selecte_conten=null;
        }
        if(this.ecuation_documen){
            this.ecuation_documen=null;
        }
    }

    CreateVisualEquation(){
        if(!this.selecte_conten){
            this.selecte_conten=document.createElement('div');
            this.selecte_conten.className='table-sheets-list-box-selectro-contenedor';
            this.selecte_conten.style.setProperty('--color-primario',this.cell.sheetstable.opcions.colorprimario);
            this.selecte_conten.style['top']='100%';
            this.selecte_conten.style['left']='0px';
            this.selecte_conten.classList.add('Sheet-table-equation-latex-contenedor-padre');
            this.selecte_conten.style.pointerEvents='none';
            this.cell.sheetstable.element.addEventListener('mousemove',this.OpacityEquation);
        }
        this.selecte_conten.innerHTML='';
        if(!this.ecuation_documen){
            this.ecuation_document = document.createElement('div');
            this.ecuation_document.className='Sheet-table-equation-latex-contenedor';
        }
        this.selecte_conten.appendChild(this.ecuation_document);
        if(!this.cell.sheetstable.superiorinput.contains(this.selecte_conten)){
            this.cell.sheetstable.superiorinput.appendChild(this.selecte_conten);
        }
        return this.ecuation_document;
    }

    Inputclick(){
        super.Inputclick();
        if(this.cell.input){
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
        this.RemoveVisualEquation();
        return null;
    }

    Serializacion(value){
        this.exprecion=value.slice(1);
        this.GetScope();
        this.CheckTypeValue(value);
        this.RenderLatex();
    }

    Inpuntkey(event){
        if(!this.cell.input){
            return null;
        }
        if(this.cell.input.value[0]!='='){
            this.#RemoveEvents();
            this.RemoveVisualEquation();
            this.cell.widgets=new SheetsWidgetCellText({sheetcell:this.cell});
            this.cell.sheetstable.cell_str=false;
            return null;
        }
        this.exprecion=this.cell.input.value.slice(1);
        this.GetScope();
        this.RenderLatex();
        this.cell.sheetstable.cell_str=true;
    }
    typeset_latex(code) {
        this.promise = this.promise.then(() => MathJax.typesetPromise(code())).catch((err) => console.error('Typeset failed: ' + err.message));
        return this.promise;
    }

    RemoveWidget(){
        this.RemoveVisualEquation();
        this.ismatrix=false;
        return null;
    }
    #CellEventMatrixUpdate(event){
        if(this.cell.widgets!=this || !this.rawdata.cellsEvents[event.cell] || !math.typeOf(this.rawdata.rawvalue)=='DenseMatrix'){            
            event.target.detEvent(event.event,this.Cell_Update_Matrix);
            return;
        }
        let isequal=(math.typeOf(event.target.widgets.value)==math.typeOf(this.rawdata.cellsEvents[event.cell][0].value)) && math.equal(event.target.widgets.value,this.rawdata.cellsEvents[event.cell][0].value);
        if(isequal){
            return;
        }

        this.ValueMatrix(this.rawdata.rawvalue);
        this.TextTypeCheck(this.rawdata.value);
        this.DisplayText();

    }

    #CellEventUpdate(event){
        if(this.cell.widgets!=this || !this.rawdata.cellsEvents[event.cell]){
            event.target.detEvent(event.event,this.Cell_Update_event);
            return;
        }
        let value=event.target.value;
        if(event.target.type=='Function' && !event.target.widgets.ismatrix){
            if(event.target.widgets.recurcividad.existe){
                return;
            }
            value=event.target.widgets.rawdata.rawvalue;
        }else{
            if(event.target.innerText=='#REF'){
                return;
            }
        }
        this.rawdata.cellsEvents[event.cell].forEach(grup=>{
            if(grup.rango){
                this.rawdata.scope[grup.rango]._data[grup.index[0]][grup.index[1]]=value;
            }else{
                this.rawdata.scope[event.cell]=value;
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

function generarIdAleatorio() {
    const alfabetoConNumeros = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const longitudSeccion = 4;
    let idAleatorio = '';

    // Generar tres secciones de cuatro caracteres cada una
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < longitudSeccion; j++) {
            const indice = Math.floor(Math.random() * alfabetoConNumeros.length);
            idAleatorio += alfabetoConNumeros.charAt(indice);
        }

        // Agregar un guion después de cada sección
        if (i < 2) {
            idAleatorio += '-';
        }
    }

    return idAleatorio;
}

function rgbToHex(rgb) {
    return '#' + rgb.map(c => (c < 16 ? '0' : '') + c.toString(16)).join('');
}

customElements.define('sheets-colum', SheetsColum, { extends: 'td' });
customElements.define('sheets-cell', SheetsCell, { extends: 'td' });
customElements.define('sheets-rows', SheetsRow, { extends: 'tr' });
customElements.define('sheets-input', SheetsInput, { extends: 'input' });
customElements.define('sheets-selector', SheetsSelector, { extends: 'div' });
customElements.define('sheets-editor-input', SheetEditoInput, { extends: 'div' });

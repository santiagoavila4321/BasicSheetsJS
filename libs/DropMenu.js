const MenuDropDownElement=document.createElement('div');
MenuDropDownElement.className='menu-dropdown-conten';
MenuDropDownElement.hidden=true;
document.body.appendChild(MenuDropDownElement);

document.addEventListener('click',(event)=>{
    if(!MenuDropDownElement.contains(event.target)){
        MenuDropDownElement.hidden=true;
        MenuDropDownElement.style.display='none';
        MenuDropDownElement.innerHTML='';
    }
});
document.addEventListener('contextmenu',(event)=>{
    if(!MenuDropDownElement.contains(event.target)){
        MenuDropDownElement.hidden=true;
        MenuDropDownElement.style.display='none';
        MenuDropDownElement.innerHTML='';
    }
});
//{'incono':'','text':'','function':''}

function DropMenu(coor,menu,submenu=null){
    let Elemenmenu=submenu;
    if(!submenu){
        MenuDropDownElement.style.left=(coor[0])+'px';
        MenuDropDownElement.style.top=(coor[1])+'px';
        Elemenmenu=MenuDropDownElement;
    }
    Elemenmenu.innerHTML='';
    menu.forEach((grupo,k) => {
        grupo.forEach((itemdata,j)=>{
            let item=document.createElement('div');
            item.className='menu-dropdown-item';
            let incono=document.createElement('i');
            incono.className='bi '+itemdata.incon;
            if(itemdata.iconstyle){
                incono.style=itemdata.iconstyle;
            }
            item.appendChild(incono);
            if(!itemdata.elemento){
                let texto=document.createElement('p');
                texto.innerText=itemdata.text;
                item.appendChild(texto);
            }else{
                item.appendChild(itemdata.elemento);
            }
            item.addEventListener('click',(ev)=>{
                if(itemdata.function){
                    itemdata.function(ev);
                }
                MenuDropDownElement.hidden=true;
                MenuDropDownElement.style.display='none';
                MenuDropDownElement.innerHTML='';
            });
            if(itemdata.submenu){
                item.classList.add('item-selector-submenu');
                let submenu=document.createElement('div');
                submenu.className='menu-dropdown-conten';
                item.addEventListener('mouseenter',(ev)=>{
                    submenu.style.left='calc(100% + 2px)';
                    //submenu.style.top=(item.getBoundingClientRect().y)+'px';
                    DropMenu(ev,itemdata.submenu,submenu);
                });
                submenu.addEventListener('mouseenter',(event)=>{
                    submenu.dataset['mouse']='enter';
                });
                item.addEventListener('mouseleave',(ev)=>{
                    function check(){
                        if(submenu.dataset['mouse']=='enter'){
                            setTimeout(()=>{
                                check();
                            },100);
                        }else{
                            submenu.hidden=true;
                            submenu.style.display='none';
                            submenu.innerHTML='';
                        }
                    }
                    setTimeout(()=>{
                        check();
                    },100);
                });
                submenu.addEventListener('mouseleave',(event)=>{
                    submenu.dataset['mouse']='leave';
                });
                Elemenmenu.appendChild(submenu);
            }
            if(j==grupo.length-1 && k!=menu.length-1){
                item.style['borderBottom']='solid rgb(100,100,100) 1px';
            }
            Elemenmenu.appendChild(item);
        });
    });
    Elemenmenu.hidden=false;
    Elemenmenu.style.display='inline-block';
}
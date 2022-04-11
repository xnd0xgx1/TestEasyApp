
import { Component, enableProdMode, OnInit } from '@angular/core';
import * as XLSX from 'xlsx'
import { interval,Observable,Subscription,timer } from 'rxjs';


export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'Scraping';

  //--XLSX
  fileNamexml= 'datos.xlsx';

  //--Variables de tabla
  tableHeaders = ["Emisora","Valor_Actual_dlrs","Valor_Act_Pesos"];
  tableRows: any = []
  marcas: Array<string>;
  usd: number;

  //--Contador
  contador = interval(2000);
  private subsObservador: Subscription = new Subscription;


  constructor(){
  enableProdMode();
  //---Inicialización de variables
   this.marcas = ['TSLA','FB','V','WMT','BRK-B','AMZN',
  'AAPL','UAA','GOOGL','MSFT','BABA','NFLX','SBUX','MELI','BKNG','EXPE','TRIP','TRVG','FSLR','SPWR','RUN',
'NVDA','INTC','AMD'];
   this.usd = 0;
  
    
  }

//#region Data
  startdata(){
    
    this.subsObservador = this.contador.subscribe(() => {this.chargedata();});
    
  }
  stopdata(){
    this.subsObservador.unsubscribe();
  }

 public addmarcas(datosmarcas: HTMLInputElement){
  this.marcas.push(datosmarcas.value);
  datosmarcas.value = "";

  }

  public removemarcas(datosmarcas: HTMLInputElement){
    var index = this.marcas.indexOf(datosmarcas.value);
    if(index !== -1){
      this.marcas.splice(index,1);
    }
    datosmarcas.value = "";
  }



  updatedata(datos: string,i: number): void{
    datos = datos.replace(/\,/g,'');
    var New = parseInt(datos);
    var conv = New * this.usd;
    this.tableRows.push({Emisora: this.marcas[i], Valor_Actual_dlrs: New,Valor_Act_Pesos: conv});

  }

  SecondStep(datos: string){

    datos = datos.replace(/\,/g,'');
    var auxiliar = parseInt(datos);
    this.usd = auxiliar;
    //#region Fetch data

    for( let cont = 0; cont< this.marcas.length; cont++){
     
      const updatedata = () => {
        return new Promise((resolve, reject)=>{
        var xml = new XMLHttpRequest();
        var url = "https://api.allorigins.win/raw?url=https://finance.yahoo.com/quote/" + this.marcas[cont];
        xml.open("GET", url , true);
        xml.responseType = "document";
         
        xml.onload = function(){
          
          if(xml.readyState == 4 && xml.status == 200){
  
           var response = xml.responseXML?.querySelectorAll("#quote-header-info fin-streamer");
         
            try{
            resolve(response![0].textContent);
            }catch{
              
              resolve(null);
            }
          }
        }
      
        xml.onerror = function(){
          console.log(xml.status,xml.statusText)
          
        };
  
        xml.send();
        })
      }
      
    //Verifica empresa correcta, si no, descarta
     updatedata().then((datos) => {
      if(datos!= null){
      this.updatedata(datos as string, cont);}
      else{
        this.marcas.splice(cont,1);
      }
    }
      );
    }
    //#endregion
  }


   chargedata(){
    this.tableRows = [];
    //#region Fetch Dolares
      const chargeusd = () => {
        return new Promise((resolve, reject)=>{
        var xml = new XMLHttpRequest();
        var url = "https://api.allorigins.win/raw?url=https://finance.yahoo.com/quote/MXN=X?p=MXN=X&.tsrc=fin-srch";
        xml.open("GET", url , true);
        xml.responseType = "document";
        xml.onload = function(){
          
          if(xml.readyState == 4 && xml.status == 200){
           var response = xml.responseXML?.querySelectorAll("#quote-header-info fin-streamer");
            resolve(response![0].textContent);
          }
        }
  
        xml.onerror = function(){
          console.log(xml.status,xml.statusText)
          
        };
        xml.send();
        })
      }
      
    //Cuando finaliza manda llamar el scrapping de los otros datos
     chargeusd().then((datos) => this.SecondStep(datos as string));
    //#endregion
  
    
    
    
   }
   //#endregion

   //#region Excel conversión
   exportexcel(){
    let element = document.getElementById('exceldata');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, this.fileNamexml);
}
  //#endregion
}

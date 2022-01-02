import { Component, Input, OnInit } from '@angular/core';
import { Producer } from '../producer';
import { FormBuilder } from '@angular/forms';

import { AngularFireDatabase } from '@angular/fire/database';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import * as Chart from 'chart.js';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-bonuses',
  templateUrl: './bonuses.component.html',
  styleUrls: ['./bonuses.component.scss']
})
export class BonusesComponent implements OnInit {

  @Input() display_all: string = "";
  producers: Producer[] = [];
  one_producer_selected = false;
  months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  
  selected_year: number = 0;

  private today = new Date();

  production_bonuses = {};
  corporate_bonuses = {};

  public barChartData = [];
  bonus_chart: any;
  bonuses_loaded = false;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public db_auth:  AngularFireAuth, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.selected_year = parseInt(this.route.snapshot.paramMap.get('year'));
        this.loadProducers();
        this.loadApplications();
        this.loadBonuses();
      } else {
        // if user is not logged in, reroute them to the login page
        this.router.navigate(['login']);
      }
    });

    var ctx = document.getElementById('canvas') as HTMLCanvasElement;
    this.bonus_chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], // your labels array
        datasets: []
      },
      options: {
        responsive: true,
        scales: {
          yAxes: [{
              id: 'left-y-axis',
              type: 'linear',
              position: 'left',
              stacked: true,
              ticks: {
                min: 0//,
                //max: 100
              }
          }]
        },
        legend: {
          display: true,
          labels: {
              // fontColor: 'rgb(255, 99, 132)'
          }
        }
      }
    });
  }

  async loadApplications() {
    this.dataService.loadApplications(this.selected_year);
    await this.dataService.until(_ => this.dataService.apps_loaded == true);
  }

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    for (const producer of this.dataService.producers) {
      if (producer.hired || this.display_all == "true") {
        this.producers.push(producer);
      }
    }
  }

  async loadBonuses() {
    this.bonus_chart.data.datasets = await this.dataService.loadBonuses(this.selected_year);

    this.production_bonuses = this.dataService.production_bonuses;
    this.corporate_bonuses = this.dataService.corporate_bonuses;

    this.bonus_chart.update();

    this.bonuses_loaded = true;
  }

  getProducerProdBonus(id: string, month: number) {
    if (!(id in this.production_bonuses)) { return 0; }
    return this.production_bonuses[id][month];
  }

  getProducerCorpBonus(id: string, month: number) {
    if (!(id in this.production_bonuses)) { return 0; }
    return this.corporate_bonuses[id][month];
  }

  getTotalProductionBonus(id: string) {
    if (!(id in this.production_bonuses)) { return 0; }
    return this.production_bonuses[id].reduce((a, b) => a + b);
  }

  getTotalCorporateBonus(id: string) {
    if (!(id in this.production_bonuses)) { return 0; }
    return this.corporate_bonuses[id].reduce((a, b) => a + b);
  }
  
  getOfficeBonusTotal() {
    let total = 0;
    for(const producer of this.producers) {
      total += parseFloat(this.getTotalProductionBonus(producer["id"]));
      total += parseFloat(this.getTotalCorporateBonus(producer["id"]));
    }
    return total;
  }

  showData(id: string) {
    for (let category of this.bonus_chart.data.datasets) {
      if (category['stack'] == id) {
        category['hidden'] = false;
      } 
    }
  }

  hideData(id: string) {
    for (let category of this.bonus_chart.data.datasets) {
      if (category['stack'] == id) {
        category['hidden'] = true;
      } 
    }
  }

  updateList(filter: string) { 
    for (const producer of this.dataService.producers) {
      if (producer["name"] == filter || filter == "All Producers") {
        this.showData(producer["id"]);
      } else {
        this.hideData(producer["id"]);
      }
    }
    
    document.getElementById("canvas").style.display = 'none';
    if (filter != "All Producers") {
      document.getElementById("canvas").style.display = 'flex';
    }

    this.bonus_chart.update();
  }

  updateBonus(e, producer_id: string, month: number) {
    let corporate_bonus = {};
    corporate_bonus[month] = Number(e.target.value);
    this.db.list('producers/'+producer_id+'/corporate_bonuses/'+this.selected_year).update('/', corporate_bonus);
  }

  filterByYear(year: number) {
    this.selected_year = year;
    this.loadApplications();
    this.loadBonuses();
  }

  getFirstName(str) {
    return str.split(" ", 1); 
  }

  chartClicked(): void {
    //console.log("chart clicked");
  }

  chartHovered(): void {
    //console.log("chart hovered");
  }
}

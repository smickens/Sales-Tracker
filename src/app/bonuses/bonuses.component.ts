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
  all_producers: Producer[] = [];
  filtered_producers: Producer[] = [];
  one_producer_selected = false;
  months = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  
  selected_year: number = 0;

  private today = new Date();

  production_bonuses = {};
  corporate_bonuses = {};
  apps_written_bonuses = {};
  bonus_breakdown = {};

  show_bonus_breakdown = false;
  breakdown_month: any = this.today.getMonth();

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
  }

  async loadApplications() {
    this.dataService.loadApplications(this.selected_year);
    await this.dataService.until(_ => this.dataService.apps_loaded_by_year.has(this.selected_year));
  }

  async loadProducers() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    for (const producer of this.dataService.producers) {
      if (producer.hired || this.display_all == "true") {
        this.all_producers.push(producer);
      }
    }

    this.filtered_producers = this.all_producers;
  }

  async loadBonuses() {
    await this.dataService.loadBonuses(this.selected_year, true);

    this.production_bonuses = this.dataService.production_bonuses[this.selected_year];
    this.corporate_bonuses = this.dataService.corporate_bonuses[this.selected_year];
    this.apps_written_bonuses = this.dataService.apps_written_bonuses[this.selected_year];
    this.bonus_breakdown = this.dataService.bonus_breakdown[this.selected_year];

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

  getProducerAppWrittenBonus(id: string, month: number) {
    if (!(id in this.apps_written_bonuses)) { return 0; }
    return this.apps_written_bonuses[id][month];
  }

  getTotalProducerAppWrittenBonus(id: string) {
    if (!(id in this.apps_written_bonuses)) { return 0; }
    return this.apps_written_bonuses[id].reduce((a, b) => a + b);
  }
  
  getOfficeBonusTotal() {
    let total = 0;
    for(const producer of this.all_producers) {
      total += parseFloat(this.getTotalProductionBonus(producer["id"]));
      total += parseFloat(this.getTotalCorporateBonus(producer["id"]));
      total += parseFloat(this.getTotalProducerAppWrittenBonus(producer["id"]));
    }
    return total;
  }

  updateBonus(e, producer_id: string, month: number) {
    let corporate_bonus = {};
    corporate_bonus[month] = Number(e.target.value);
    this.db.list('producers/'+producer_id+'/corporate_bonuses/'+this.selected_year).update('/', corporate_bonus);
  }

  updateList(selected_producer_id: string) { 
    if (selected_producer_id == "All Producers") {
      this.filtered_producers = this.all_producers;
      this.show_bonus_breakdown = false;
    } else {
      this.filtered_producers = [this.getProducerBy(selected_producer_id)];
      this.show_bonus_breakdown = true;
    }
  }
  
  getProducerBy(id: string) {
    for (const producer of this.all_producers) {
      if (producer.id == id) {
        return producer
      }
    }
    return null;
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

  updateBreakdownMonth(month: any) {
    this.breakdown_month = month;
  }
}

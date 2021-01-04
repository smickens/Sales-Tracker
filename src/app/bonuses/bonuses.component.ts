import { Component, OnInit, ViewChild } from '@angular/core';
import { Producer } from '../producer';
import { FormBuilder } from '@angular/forms';

import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { Color } from 'ng2-charts';
import * as Chart from 'chart.js';

@Component({
  selector: 'app-bonuses',
  templateUrl: './bonuses.component.html',
  styleUrls: ['./bonuses.component.scss']
})
export class BonusesComponent implements OnInit {

  producers: Producer[] = [];
  all_producers: Producer[] = [];
  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  production_bonuses = {};
  corporate_bonuses = {};
  
  selected_year: number = 0;
  addBonusForm = this.fb.group({
    producer_id: ['Select Producer'],
    month: [''],
    year: [''],
    corporate_bonus: [0]
  });

  private today = new Date();

  // yellow: F6D55C
  // mint green: 3CAEA3

  bonus_chart: any;
  public barChartData = [];
  bonuses_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
        this.selected_year = this.today.getFullYear();
        this.loadBonusData();
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);
  }

  ngOnInit(): void {
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
    // sets month/year value on bonus form to current month/year
    this.addBonusForm.setValue(
      { 
        producer_id: 'Select Producer',
        month: this.months[this.today.getMonth()], 
        year: this.today.getFullYear(),
        corporate_bonus: 0
      }
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  loadBonusData() {
    // gets list of producers and corporate bonuses
    let sub1 = this.db.list('producers').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        const producer = snap.payload.val() as Producer;
        producer.id = snap.key;

        if (this.all_producers.indexOf(producer) == -1) {
          this.all_producers.push(producer);
        }
        if (this.producers.indexOf(producer) == -1) {
          this.producers.push(producer);
        }
        // if (!this.bonuses_loaded) { 
        //   this.all_producers.push(producer);
        //   this.producers.push(producer);
        // }
        let i: number = this.getProducerIndex(producer["id"]);
        if (!this.bonuses_loaded) {
          this.barChartData.push({data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: producer.name + " CB", stack: producer.id, 
          backgroundColor: producer["corp_color"], hoverBackgroundColor: producer["hover_color"]})
          this.barChartData.push({data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: producer.name + " PB", stack: producer.id, 
          backgroundColor: producer["color"], hoverBackgroundColor: producer["hover_color"]})
          if (!(producer["id"] in this.production_bonuses)) {
            this.production_bonuses[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
        } else {
          if (index == 0) {
            // clear corporate bonus values from bar chart data first time through
            for (let i = 0; i < this.barChartData.length; i++) {
              let category = this.barChartData[i];
              if (i % 2 == 0) {
                category['data'] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              }            
            }
          }
        }
        this.corporate_bonuses[producer["id"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        // gets corporate bonuses
        if ("corporate_bonuses" in snap.payload.val()) {
          if (this.selected_year in snap.payload.val()["corporate_bonuses"]) {
            const corporate_bonus = producer["corporate_bonuses"][this.selected_year];
            //console.log(corporate_bonus);
            for (let month in corporate_bonus) {
              //console.log(month + ": " + corporate_bonus[month]);
              this.corporate_bonuses[producer["id"]][parseInt(month)-1] += corporate_bonus[month];
              //console.log("Corp-ID: " + producer["id"] + "   Bonus: " + corporate_bonus[month]);
              this.barChartData[i*2].data[parseInt(month)-1] += corporate_bonus[month];
            }
          }
        }
        // once the snapshot's length and the index match, it means this was the last one
        if (snapshot.length == index+1) {
          this.bonus_chart.data.datasets = this.barChartData;
          this.bonus_chart.update();
        }
        //console.log(this.corporate_bonuses);
     })
    );
    this.subscriptions.push(sub1);

    // gets production bonuses
    let sub2 = this.db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        const app = snap.payload.val();

        const app_type = app["type"] as string;
        const app_date = app["date"] as string;
        let app_month = parseInt(app_date.substring(5, 7));
        const app_year = parseInt(app_date.substring(0, 4));
        let bonus = app["bonus"];

        let app_went_through = false;
        /*
          Life - Issue/Bonus Month “January”
            ? might change issue_month to issue_date 	# and have it include 08-2019
          Auto - Status “Issued”
          Bank - Status “Issued”
          Fire - Status “Issued”
          Health - Status “Taken”
        */
        // TODO: check jan and dec ones to make sure month doesn't error
        if (app["status"] == "Taken" || app["status"] == "Issued") {
          app_went_through = true;
        }
        if (app_type == "life") {
          app_month = app["issue_month"];
          console.log("changed month to issue month - " + app_month);
          bonus = app["paid_bonus"];
        }
        
        if (app_went_through == true && app_year == this.selected_year && bonus > 0) {
          const producer_id = app["producer_id"];
          // production bonus
          if (!(producer_id in this.production_bonuses)) {
            this.production_bonuses[producer_id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
          this.production_bonuses[producer_id][app_month-1] += bonus;
          console.log("Name: " + producer_id + "    Month: " + app_month + "   Bonus: " + bonus);
          let i = this.getProducerIndex(producer_id);
          this.barChartData[(i*2)+1].data[app_month-1] += bonus;
        }

        if (app_year == this.selected_year && app["co_producer_bonus"] != "" && app["co_producer_bonus"] > 0) {
          // co-production bonus
          const co_producer_bonus = app["co_producer_bonus"];
          if (co_producer_bonus > 0 && co_producer_bonus != null) {
            const co_producer_id = app["co_producer_id"];
            this.production_bonuses[co_producer_id][app_month-1] += co_producer_bonus;
            let i = this.getProducerIndex(co_producer_id);
            console.log("Co- ID: " + co_producer_id + "   Bonus: " + co_producer_bonus + "  " + i);
            this.barChartData[(i*2)+1].data[app_month-1] += co_producer_bonus;
          }
        }
        // once the snapshot's length and the index match, it means this was the last one
        if (snapshot.length == index+1) {
          this.bonus_chart.data.datasets = this.barChartData;
          this.bonus_chart.update();
        }
        this.bonuses_loaded = true;
      })
    );
    this.subscriptions.push(sub2);
  }

  showData(id: string) {
    for (let category of this.barChartData) {
      if (category['stack'] == id) {
        category['hidden'] = false;
      } 
    }
  }

  hideData(id: string) {
    for (let category of this.barChartData) {
      if (category['stack'] == id) {
        category['hidden'] = true;
      } 
    }
  }

  updateList(filter: string) {
    this.producers = [];
    this.db.list('producers').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        const producer = snap.payload.val() as Producer;
        producer.id = snap.key;
        if (producer["name"] == filter || filter == "All Producers") {
          // show their data
          this.producers.push(producer);
          this.showData(producer["id"]);
        } else {
          this.hideData(producer["id"]);
        }
        if (snapshot.length == index+1) {
          this.bonus_chart.update();
        }
       })
    );
  }

  get(field: string) {
    return this.addBonusForm.get(field).value;
  }

  editBonus(e) {
    //e.target.removeAttribute('readonly');
  }

  updateBonus(e, producer_id: string, month: number) {
    //e.target.setAttribute('readonly', true);
    //if (e.target.value != 0) {
    let corporate_bonus = {};
    corporate_bonus[month] = Number(e.target.value);
    this.db.list('producers/'+producer_id+'/corporate_bonuses/'+this.selected_year).update('/', corporate_bonus);
    //}
  }

  filterByYear(year: number) {
    this.selected_year = year;
    // clears out bar chart data values
    for (let category of this.barChartData) {
      category['data'] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    // clears out production bonuses
    for (const producer_id in this.production_bonuses) {
      this.production_bonuses[producer_id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    this.loadBonusData();
  }

  getProducerIndex(producer_id: string) {
    let index = 0;
    for (const producer of this.all_producers) {
      if (producer.id == producer_id) {
        return index;
      }
      index += 1;
    }
    return -1;
  }

  chartClicked(): void {
    //console.log("chart clicked");
  }

  chartHovered(): void {
    //console.log("chart hovered");
  }

}

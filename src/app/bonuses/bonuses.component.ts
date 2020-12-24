import { Component, OnInit } from '@angular/core';
import { Producer } from '../producer';
import { FormBuilder } from '@angular/forms';

import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { Color } from 'ng2-charts';

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
  
  addBonusForm = this.fb.group({
    producer_name: ['Select Producer'],
    month: [''],
    year: [''],
    corporate_bonus: [0]
  });

  add_bonus = false; // true when add bonus form is being displayed
  private today = new Date();

  colors = ["#173F5F", "#20639B", "#3CAEA3", "#F6D55C", "#ED553B"];
  hover_colors = ["#235f90", "#277abe", "#67cbc1", "#fae69e", "#f28673"]

  // chart for team showing their bonus broken down by month and type
  public barChartOptions = {
    scales: {
      yAxes: [{
          id: 'left-y-axis',
          type: 'linear',
          position: 'left',
          stacked: true,
          ticks: {
            min: 0,
            max: 100
          }
      }]
    },
    legend: {
      display: true,
      labels: {
          // fontColor: 'rgb(255, 99, 132)'
      }
    }
  };

  // public barChartOptions = {
  //   scaleShowVerticalLines: false,
  //   responsive: true
  // };

  public barChartLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  public barChartType = 'bar';
  public barChartLegend = true;

  public barChartData = [];

  // public barChartData = [
  //   {data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: 'pb', stack: "test"},
  //   {data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: 'cb', stack: "test"}
  // ];

  public barChartColors: Color[] = [
    // { backgroundColor: '#E8AA9F' }
  ]

  bonuses_loaded = false;

  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
        this.loadBonusData();
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);
  }

  ngOnInit(): void {
    // sets month/year value on bonus form to current month/year
    this.addBonusForm.setValue(
      { 
        producer_name: 'Select Producer',
        month: this.months[this.today.getMonth()-1], 
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
    //  get current year
    let year = this.today.getFullYear();

    // gets list of producers
    let index = 0;
    let producer_indexes = [];
    let sub1 = this.db.list('producers').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const producer = snap.payload.val() as Producer;
        this.all_producers.push(producer);
        this.producers.push(producer);
        this.barChartData.push({data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: producer.name + " CB", stack: producer.name, 
        backgroundColor: this.colors[index], hoverBackgroundColor: this.hover_colors[index]})
        this.barChartData.push({data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: producer.name + " PB", stack: producer.name, 
        backgroundColor: this.colors[index], hoverBackgroundColor: this.hover_colors[index]})
        producer_indexes.push(producer["name"]);

        this.production_bonuses[producer["name"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.corporate_bonuses[producer["name"]] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        // gets corporate bonuses
        if ("corporate_bonuses" in snap.payload.val()) {
          if (year in snap.payload.val()["corporate_bonuses"]) {
            const corporate_bonus = producer["corporate_bonuses"][year];
            //console.log(corporate_bonus);
            for (let month in corporate_bonus) {
              console.log(month + ": " + corporate_bonus[month]);
              this.corporate_bonuses[producer["name"]][parseInt(month)-1] += corporate_bonus[month];
              console.log("Corp-Name: " + producer["name"] + "   Bonus: " + corporate_bonus[month]);
              //this.barChartData[1].data[parseInt(month)-1] += corporate_bonus[month];
              this.barChartData[index*2].data[parseInt(month)-1] += corporate_bonus[month];
            }
          }
        }
        index += 1;
        //console.log(this.corporate_bonuses);
     })
    );
    this.subscriptions.push(sub1);

    // gets production bonuses
    let sub2 = this.db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const app = snap.payload.val();

        const app_type = app["type"] as string;
        const app_date = app["date"] as string;
        const app_month = parseInt(app_date.substring(5, 7));
        const app_year = parseInt(app_date.substring(0, 4));

        let app_went_through = false;
        /*
          Life - Issue/Bonus Month “January”
            ? might change issue_month to issue_date 	# and have it include 08-2019
          Auto - Status “Issued”
          Bank - Status “Issued”
          Fire - Status “Issued”
          Health - Status “Taken”
        */
        if (app["issue_month"] == "" || app["status"] == "Taken" || app["status"] == "Issued") {
          app_went_through = true;
        }

        // TODO: NEED SOME KIND OF DROPDOWN FOR YEAR
        // app_went_through == true && 
        if (app_year == year) {
          const producer_name = app["producer_name"];
          // production bonus
          const bonus = app["bonus"];
          this.production_bonuses[producer_name][app_month-1] += bonus;
          console.log("Name: " + producer_name + "    Month: " + app_month + "   Bonus: " + bonus);
          let i = producer_indexes.indexOf(producer_name);
          this.barChartData[(i*2)+1].data[app_month-1] += bonus;

          // co-production bonus
          const co_producer_bonus = app["co_producer_bonus"];
          if (co_producer_bonus > 0 && co_producer_bonus != null) {
            const co_producer_name = app["co_producer_name"];
            this.production_bonuses[co_producer_name][app_month-1] += co_producer_bonus;
            //this.barChartData[0].data[app_month-1] += co_producer_bonus;
            // for (let i = 0; i < this.barChartData.length; i++) {
            //   if (this.barChartData[i]["label"] == producer_name) {
            //     this.barChartData[i].data[app_month-1] += co_producer_bonus;
            //   }
            // }
            let i = producer_indexes.indexOf(co_producer_name);
            console.log("Co-: " + co_producer_name + "   Bonus: " + co_producer_bonus + "  " + i);
            this.barChartData[(i*2)+1].data[app_month-1] += co_producer_bonus;
            // for (let i = 0; i < this.barChartData.length; i++) {
            //   if (this.barChartData[i]["label"] == producer_name) {
            //     this.barChartData[(i*2)+1].data[app_month-1] += co_producer_bonus;
            //     break;
            //   }
            // }
          }
        }
        console.log(this.barChartData);
        this.bonuses_loaded = true;
       })
    );
    this.subscriptions.push(sub2);
  }

  updateList(filter: string) {
    this.producers = [];
    this.db.list('producers').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const producer = snap.payload.val();
        console.log(producer);
        if (producer["name"] == filter || filter == "All Producers") {
          this.producers.push(producer);
        }
       })
    );
  }

  get(field: string) {
    return this.addBonusForm.get(field).value;
  }

  addBonus() {
    let producer_name = this.get("producer_name");
    let month = this.months.indexOf(this.get("month")) + 1;
    let year = this.get("year"); 
    let bonus = {};
    bonus[month] = this.get("corporate_bonus");

    if (producer_name != "Select Producer" && bonus != 0) {
      this.db.list('producers').snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
          const producer = snap.payload.val();
          if (producer["name"] == producer_name) {
            // adds new bonus
            this.db.list('producers/'+snap.key+'/corporate_bonuses/'+year).update('/', bonus);
          }
         })
      );
    } 
  }

  filterByYear(filter: string) {
    this.producers = [];
    this.db.list('producers').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const producer = snap.payload.val();
        console.log(producer);
        if (producer["name"] == filter || filter == "All Producers") {
          this.producers.push(producer);
        }
       })
    );
  }

  chartClicked(): void {
    //console.log("chart clicked");
  }

  chartHovered(): void {
    //console.log("chart hovered");
  }

}

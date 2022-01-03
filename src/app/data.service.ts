import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { Subscription } from 'rxjs';
import { Application } from './application';
import { Producer } from './producer';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  producers: Producer[] = [];

  applications = {}

  barChartData = [];
  production_bonuses = {};
  corporate_bonuses = {};

  subscriptions: Subscription[] = [];

  auth_state_ob: Observable<any>
  application_obs = {};
  prod_ob: Observable<any[]>;
  goals_ob: Observable<any[]>;
  notes_ob: Observable<any[]>;

  prod_loaded = false;
  apps_loaded = false;
  
  constructor(private db: AngularFireDatabase, public  db_auth:  AngularFireAuth, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
        this.loadProducers();

        let today = new Date();
        this.loadApplications(today.getFullYear());
      } else {
        // if user is not logged in, then reroute them to the login page
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);

    this.auth_state_ob = db_auth.authState;

    this.prod_ob = db.list('producers').snapshotChanges();
    this.goals_ob = db.list('goals').snapshotChanges();
    this.notes_ob = db.list('notes').snapshotChanges();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  loadProducers() {
    this.prod_ob.subscribe((snapshot: any) => snapshot.map((snap, index) => {
      let producer: Producer = snap.payload.val() as Producer;
      producer.id = snap.key;
      producer.pin = snap.payload.val().pin;

      this.producers.push(producer);

      this.corporate_bonuses[producer.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.production_bonuses[producer.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      if (producer.hired) {
        this.barChartData.push({
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
          label: this.getFirstName(producer.name) + " CB", 
          stack: producer.id, 
          backgroundColor: producer.corp_color, 
          hoverBackgroundColor: producer.hover_color
        });
  
        this.barChartData.push({
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
          label: this.getFirstName(producer.name) + " PB", 
          stack: producer.id, 
          backgroundColor: producer.color, 
          hoverBackgroundColor: producer.hover_color
        }); 
      }

      if (snapshot.length == index+1) { 
        this.prod_loaded = true;
        // console.log("done loading producers");
      }
    }));
  }

  loadApplications(year: number) {
    if (year in this.applications) {
      return;
    }

    this.apps_loaded = false;

    // clear application list
    this.applications[year] = {
      'life': [],
      'auto': [],
      'fire': [],
      'health': [],
      'bank': [],
      'mutual-funds': []
    }

    // load all apps for inputed year
    this.getApplications(year).pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map((snap) => {
        const app = snap.payload.val();
        const app_id = snap.key;
        app.id = app_id;

        // TODO: see if this can be written as one line
        let application: Application = app as Application;
        this.applications[year][app["type"]].push(application);
      }),
      (error: any) => { console.log(error); },
      () => { 
        this.apps_loaded = true;
        // console.log("done loading apps for year " + year);
      } 
    );
  }

  getApplications(year: number): Observable<Application[]> {
    if (!(year in this.application_obs)) {
      this.application_obs[year] = this.db.list('apps/'+year).snapshotChanges();
    }
    return this.application_obs[year];
  }

  getAllApps(year: number) {
    let all_apps: Application[] = [];
    for (const app_type in this.applications[year]) {
      all_apps.push(...this.applications[year][app_type]);
    }
    return all_apps;
  }

  getAppsByMonth(type: string, month: number, year: number) {
    if (month == 0) { return this.applications[year][type] }
    return this.applications[year][type].filter(app => this.inMonth(app["date"], month))
  }
  
  
  getAppsByMonthAndProducer(type: string, month: number, year: number, producer_id: string) {
    if (month == 0) { return this.applications[year][type] }

    function producerFilter(value: string) {
      return producer_id == "" || producer_id == value || producer_id == "All Producers";
    }

    return this.applications[year][type].filter(app => this.inMonth(app["date"], month) && producerFilter(app["producer_id"]));
  }

  private inMonth(value: string, month: number) {
    return parseInt(value.substring(5, 7)) == month;
  }

  // used for bonuses page
  async loadBonuses(year: number) {
    if (year in this.corporate_bonuses) {
      // console.log("already loaded bonuses for year " + year);
      this.fillInBarChartData(year);
      return this.barChartData;
    }
    // console.log("loading bonuses for year " + year);
    await this.until(_ => this.prod_loaded);

    this.corporate_bonuses[year] = {};
    this.production_bonuses[year] = {};

    // clears out bar chart data values
    for (let category of this.barChartData) {
      category['data'] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    // * first, gets corporate bonuses
    for (const producer of this.producers) {
      this.corporate_bonuses[year][producer.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.production_bonuses[year][producer.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      if ("corporate_bonuses" in producer && year in producer.corporate_bonuses) {
        const corporate_bonus = producer["corporate_bonuses"][year];
        for (let month in corporate_bonus) {
          this.corporate_bonuses[year][producer["id"]][parseInt(month)-1] += corporate_bonus[month];

          let i: number = this.getProducerIndex(producer.id);
          if (producer.hired) {
            this.barChartData[i*2].data[month] += corporate_bonus[month];
          }
        }
      } 
    }

    await this.until(_ => this.apps_loaded);
    // * then, gets production bonuses
    let all_apps: Application[] = await this.getAllApps(year);
    for (const app of all_apps) {
      const app_date = app["date"] as string;
      let app_month = parseInt(app_date.substring(5, 7));
      const app_year = parseInt(app_date.substring(0, 4));
      let bonus = app["bonus"];

      let app_went_through = false;
      if (app["status"] == "Taken" || app["status"] == "Issued") {
        app_went_through = true;
      }
      if (app.type == "auto" && app["status"] != "Declined" && app["status"] != "Cancelled") {
        app_went_through = true;
      }
      if (app.type == "life") {
        app_month = app["issue_month"];
        //console.log("changed month to issue month - " + app_month);
        bonus = app["paid_bonus"];
      }
      
      if (app_went_through == true && app_year == year && bonus > 0) {
        const producer_id = app["producer_id"];
        this.production_bonuses[year][producer_id][app_month-1] = ((this.production_bonuses[year][producer_id][app_month-1] * 100) + (bonus * 100)) / 100;
        //console.log("Name: " + producer_id + "    Month: " + app_month + "   Bonus: " + bonus);
        let i = this.getProducerIndex(producer_id);
        if (this.isHired(producer_id)) {
          this.barChartData[(i*2)+1].data[app_month-1] += bonus;
        }
      }

      if (app_year == year && app["co_producer_bonus"] > 0) {
        // co-production bonus
        const co_producer_bonus = app["co_producer_bonus"];
        if (co_producer_bonus > 0 && co_producer_bonus != null) {
          const co_producer_id = app["co_producer_id"];
          this.production_bonuses[year][co_producer_id][app_month-1] = ((this.production_bonuses[year][co_producer_id][app_month-1] * 100) + (co_producer_bonus * 100)) / 100;
          let i = this.getProducerIndex(co_producer_id);
          if (this.isHired(co_producer_id)) {
            //console.log("Co- ID: " + co_producer_id + "   Bonus: " + co_producer_bonus + "  " + i);
            this.barChartData[(i*2)+1].data[app_month-1] += co_producer_bonus;
          }
        }
      }
    }

    return this.barChartData;
  }

  fillInBarChartData(year: number) {
    // clears out bar chart data values
    for (let category of this.barChartData) {
      category['data'] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    // grabs data for inputed year
    for (const producer of this.producers) {
      let i: number = this.getProducerIndex(producer.id);
      if (producer.hired) {
        for (let month = 0; month < 12; month++) {
          this.barChartData[i*2].data[month] = this.corporate_bonuses[year][month];
          this.barChartData[(i*2)+1].data[month] = this.production_bonuses[year][month];
        }
      }
    }
  }

  // used for timesheet prior month bonus
  async loadBonusesForTimesheet(year: number) {
    if (year in this.corporate_bonuses) {
      // console.log("already loaded bonuses for year " + year);
      return;
    }
    // console.log("loading bonuses for year " + year);
    await this.until(_ => this.prod_loaded);

    this.corporate_bonuses[year] = {};
    this.production_bonuses[year] = {};

    // * first, gets corporate bonuses
    for (const producer of this.producers) {
      this.corporate_bonuses[year][producer.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.production_bonuses[year][producer.id] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      if ("corporate_bonuses" in producer && year in producer.corporate_bonuses) {
        const corporate_bonus = producer["corporate_bonuses"][year];
        for (let month in corporate_bonus) {
          this.corporate_bonuses[year][producer["id"]][parseInt(month)-1] += corporate_bonus[month];
        }
      } 
    }

    await this.until(_ => this.apps_loaded);
    // * then, gets production bonuses
    let all_apps: Application[] = await this.getAllApps(year);
    for (const app of all_apps) {
      const app_date = app["date"] as string;
      let app_month = parseInt(app_date.substring(5, 7));
      const app_year = parseInt(app_date.substring(0, 4));
      let bonus = app["bonus"];

      let app_went_through = false;
      if (app["status"] == "Taken" || app["status"] == "Issued") {
        app_went_through = true;
      }
      if (app.type == "auto" && app["status"] != "Declined" && app["status"] != "Cancelled") {
        app_went_through = true;
      }
      if (app.type == "life") {
        app_month = app["issue_month"];
        //console.log("changed month to issue month - " + app_month);
        bonus = app["paid_bonus"];
      }
      
      if (app_went_through == true && app_year == year && bonus > 0) {
        const producer_id = app["producer_id"];
        this.production_bonuses[year][producer_id][app_month-1] = ((this.production_bonuses[year][producer_id][app_month-1] * 100) + (bonus * 100)) / 100;
      }

      if (app_year == year && app["co_producer_bonus"] > 0) {
        // co-production bonus
        const co_producer_bonus = app["co_producer_bonus"];
        if (co_producer_bonus > 0 && co_producer_bonus != null) {
          const co_producer_id = app["co_producer_id"];
          this.production_bonuses[year][co_producer_id][app_month-1] = ((this.production_bonuses[year][co_producer_id][app_month-1] * 100) + (co_producer_bonus * 100)) / 100;
        }
      }
    }
  }

  isHired(id: string) {
    for (const producer of this.producers) {
      if (producer.id == id) {
        return producer.hired;
      }
    }
    return false;
  }

  getProducerIndex(producer_id: string) {
    let index = 0;
    let hired_producers = this.producers.filter(producer => producer.hired == true);
    for (const producer of hired_producers) {
      if (producer.id == producer_id) {
        return index;
      }
      index += 1;
    }
    return -1;
  }

  until(conditionFunction) {
    const poll = resolve => {
      if (conditionFunction()) resolve();
      else setTimeout(_ => poll(resolve), 300);
    }
  
    return new Promise(poll);
  }

  getFirstName(str) {
    return str.split(" ", 1); 
  }
}

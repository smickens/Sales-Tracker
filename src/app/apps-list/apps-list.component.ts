import { Component, OnInit } from '@angular/core';
import { Producer } from "../producer";
import { LifeApp, AutoApp, BankApp, FireApp, HealthApp } from '../application';
import { AngularFireDatabase } from '@angular/fire/database';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-apps-list',
  templateUrl: './apps-list.component.html',
  styleUrls: ['./apps-list.component.scss']
})
export class AppsListComponent implements OnInit {
  app_type: string = "";
  headers: string[] = ["#", "Date", "Producer", "Client"];
  apps = [];

  producers: Producer[] = [];

  life_headers: string[] = ["Premium", "Mode", "Annual Premium", "Policy Type", "Product", "Client Type", "Bonus", "Taken", "Paid Bonus", "Issue / Bonus Month", "Life Pivot Bonus"];
  auto_headers: string[] = ["Auto Type", "Tiers", "Bonus", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  bank_headers: string[] = ["Deposit", "Premium", "Mode", "Status", "Annual Premium", "Product Type", "Product", "Bonus", "Marketing Source"];
  fire_headers: string[] = ["Product", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  health_headers: string[] = ["Premium", "Mode", "Status", "Annual Premium", "Product", "Bonus", "Marketing Source"];

  life_apps: LifeApp[] = [];
  auto_apps: AutoApp[] = [];
  bank_apps: BankApp[] = [];
  fire_apps: FireApp[] = [];
  health_apps: HealthApp[] = [];

  subscriptions: Subscription[] = [];
  year: number = 0;

  constructor(private db: AngularFireDatabase, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;

        // loads producers
        let producer_sub = db.list('producers').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
            let producer: Producer = {
              name: snap.payload.val().name,
              id: snap.key
            }
            this.producers.push(producer);
        }));
        this.subscriptions.push(producer_sub);

        // loads applications
        let sub2 = db.list('applications').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
            const app = snap.payload.val();
            console.log(app);
            if (app["type"] == "life") {
              this.life_apps.push(app as LifeApp);
            } else if (app["type"] == "auto") {
              this.auto_apps.push(app as AutoApp);
            } else if (app["type"] == "bank") {
              this.bank_apps.push(app as BankApp);
            } else if (app["type"] == "fire") {
              this.fire_apps.push(app as FireApp);
            } else if (app["type"] == "health") {
              this.health_apps.push(app as HealthApp);
            }
            const app_id = snap.key;
            app.id = app_id;
    
            this.getHeaders();
            this.getApps();
           })
        );
        this.subscriptions.push(sub2);
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);

  }

  ngOnInit(): void {
    let date: Date = new Date(); 
    this.year = date.getFullYear();

    this.app_type = this.router.url.substring(1);
    this.getHeaders();
    this.getApps();
    //this.app_type = this.route.snapshot.paramMap.get('type');
    // this.route.params.subscribe(params => {
    //   this.app_type = params['type'];
    //   this.getHeaders();
    //   this.getApps();
    // });

    // maybe have it set producers to all producers on app list change
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  getHeaders() {
    this.headers = ["#", "Date", "Producer", "Client"];
    let headers_to_copy;
    if (this.app_type === "life") {
      headers_to_copy = this.life_headers;
    } else if (this.app_type === "auto") {
      headers_to_copy = this.auto_headers;
    } else if (this.app_type === "bank") {
      headers_to_copy = this.bank_headers;
    } else if (this.app_type === "fire") {
      headers_to_copy = this.fire_headers;
    } else if (this.app_type === "health") {
      headers_to_copy = this.health_headers;
    }
    for (const header of headers_to_copy) {
      this.headers.push(header);
    }
    this.headers.push("Co-Producer Name");
    this.headers.push("Co-Producer Bonus");
  }

  getApps() {
    this.apps = [];
    let apps_to_copy;
    if (this.app_type === "life") {
      apps_to_copy = this.life_apps;
    } else if (this.app_type === "auto") {
      apps_to_copy = this.auto_apps;
    } else if (this.app_type === "bank") {
      apps_to_copy = this.bank_apps;
    } else if (this.app_type === "fire") {
      apps_to_copy = this.fire_apps;
    } else if (this.app_type === "health") {
      apps_to_copy = this.health_apps;
    }
    for (const app of apps_to_copy) {
      this.apps.push(app);
    }

    // by default it sorts the apps by date
    this.apps.sort((a, b) => a.date.localeCompare(b.date));
    //console.log(this.apps);
  }

  editApp(id: string) {
    //console.log("edit" + id);
    this.router.navigate([this.app_type + '/' + id]);
  }

  updateList(filter: string) {
    this.apps = [];
    this.db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const app = snap.payload.val();
        //console.log(app);
        if (app["producer_name"] == filter || filter == "All Producers") {
          if (app["type"] == this.app_type) {
            this.apps.push(app);
          }
          const app_id = snap.key;
          //console.log(app_id);
          app.id = app_id;
        }
       })
    );
  }

  orderList(filter: string) {
    if (filter == "date") {
      this.apps.sort((a, b) => a.date.localeCompare(b.date));
    } else if (filter == "client_name") {
      this.apps.sort((a, b) => a.client_name.localeCompare(b.client_name));
    }
  }

  getProducerName(id: string) {
    for (const producer of this.producers) {
      if (producer.id == id) {
        return producer.name;
      }
    }
  }

}

import { Component, OnInit } from '@angular/core';
import { Producer, PRODUCERS } from "../producer";
import { Application, LifeApp, AutoApp, BankApp, FireApp, HealthApp } from '../application';
import { AngularFireDatabase } from 'angularfire2/database';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';

@Component({
  selector: 'app-apps-list',
  templateUrl: './apps-list.component.html',
  styleUrls: ['./apps-list.component.scss']
})
export class AppsListComponent implements OnInit {
  app_type: string = "";
  headers: string[] = ["#", "Date", "Producer", "Client"];
  apps = [];

  producers: Producer[] = PRODUCERS;

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

  constructor(private db: AngularFireDatabase, private route: ActivatedRoute, private location: Location, private router: Router) {
    db.list('/producers').valueChanges().subscribe(producers => {
      this.producers = producers as Producer[];
    });
    db.list('applications').snapshotChanges().subscribe(
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
        console.log(app_id);
        app.id = app_id;

        this.getHeaders();
        this.getApps();
       })
    );
    // db.list('/applications').valueChanges().subscribe(apps => {
    //   apps.forEach(app => {
    //     console.log(app);
    //     if (app["type"] == "life") {
    //       this.life_apps.push(app as LifeApp);
    //     } else if (app["type"] == "auto") {
    //       this.auto_apps.push(app as AutoApp);
    //     } else if (app["type"] == "bank") {
    //       this.bank_apps.push(app as BankApp);
    //     } else if (app["type"] == "fire") {
    //       this.fire_apps.push(app as FireApp);
    //     } else if (app["type"] == "health") {
    //       this.health_apps.push(app as HealthApp);
    //     }
    //   });
      // this.getHeaders();
      //this.getApps();
    //});
    // i think this connection stays open even when leaving page, so look into how you do a once check
  }

  ngOnInit(): void {
    //this.app_type = this.route.snapshot.paramMap.get('type');
    this.route.params.subscribe(params => {
      this.app_type = params['type'];
      this.getHeaders();
      this.getApps();
    });

    // maybe have it set producers to all producers on app list change
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
  }

  editApp(id: string) {
    console.log("edit" + id);
    this.router.navigate([this.app_type + '/' + id]);
  }

  updateList(producer: string) {
    let filter = producer;
    this.apps = [];
    this.db.list('applications').snapshotChanges().subscribe(
      (snapshot: any) => snapshot.map(snap => {
        const app = snap.payload.val();
        console.log(app);
        if (app["producer_name"] == filter || filter == "All Producers") {
          if (app["type"] == this.app_type) {
            this.apps.push(app);
          }
          const app_id = snap.key;
          console.log(app_id);
          app.id = app_id;
        }
       })
    );
  }

}

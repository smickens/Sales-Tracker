import { Component, OnInit } from '@angular/core';
import { Producer } from "../producer";
import { LifeApp, AutoApp, BankApp, FireApp, HealthApp, MutualFundApp, Application } from '../application';
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
  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  producers: Producer[] = [];

  life_headers: string[] = ["Premium", "Mode", "Annual Premium", "Policy Type", "Product", "Client Type", "Bonus", "Status", "Paid Bonus", "Issue / Bonus Month", "Life Pivot Bonus"];
  auto_headers: string[] = ["Auto Type", "Tiers", "Bonus", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  bank_headers: string[] = ["Product Type", "Bonus", "Status", "Marketing Source"];
  fire_headers: string[] = ["Product", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  health_headers: string[] = ["Premium", "Mode", "Status", "Annual Premium", "Product", "Bonus", "Marketing Source"];
  mutual_funds_headers: string[] = ["Product Type", "Amount", "Marketing Source"];

  life_apps = new Set();
  auto_apps = new Set();
  bank_apps = new Set();
  fire_apps = new Set();
  health_apps = new Set();
  mutual_funds_apps = new Set();

  // life_apps: LifeApp[] = [];
  // auto_apps: AutoApp[] = [];
  // bank_apps: BankApp[] = [];
  // fire_apps: FireApp[] = [];
  // health_apps: HealthApp[] = [];
  // mutual_funds_apps: MutualFundApp[] = [];

  subscriptions: Subscription[] = [];
  year: number = 0;

  selected_app_id = "";
  isHoveringDelete = false;

  constructor(private db: AngularFireDatabase, public  db_auth:  AngularFireAuth, private route: ActivatedRoute, private location: Location, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;

        let date: Date = new Date(); 
        this.year = date.getFullYear();
        this.app_type = this.router.url.substring(1);

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
        let app_sub = db.list('applications').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map((snap, index) => {
            const app = snap.payload.val();
            //console.log(app);
            if (app["type"] == "life" && !this.life_apps.has(app)) {
              this.life_apps.add(app);
            } else if (app["type"] == "auto" && !this.auto_apps.has(app)) {
              this.auto_apps.add(app);
            } else if (app["type"] == "bank" && !this.bank_apps.has(app)) {
              this.bank_apps.add(app);
            } else if (app["type"] == "fire" && !this.fire_apps.has(app)) {
              this.fire_apps.add(app);
            } else if (app["type"] == "health" && !this.health_apps.has(app)) {
              this.health_apps.add(app);
            } else if (app["type"] == "mutual-funds" && !this.mutual_funds_apps.has(app)) {
              this.mutual_funds_apps.add(app);
            }
            const app_id = snap.key;
            app.id = app_id;
    
            if (snapshot.length == index+1) {
              this.getHeaders();
              this.getApps();
            }
           })
        );
        this.subscriptions.push(app_sub);
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);

  }

  ngOnInit(): void {
    
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
    } else if (this.app_type === "mutual-funds") {
      headers_to_copy = this.mutual_funds_headers;
    }
    for (const header of headers_to_copy) {
      this.headers.push(header);
    }
    if (this.app_type != "mutual-funds") {
      this.headers.push("Co-Producer Name");
    }
    if (this.app_type != 'auto' && this.app_type != "fire" && this.app_type != "mutual-funds") {
      this.headers.push("Co-Producer Bonus");
    }
  }

  getApps() {
    this.apps = [];
    let apps_to_copy;
    if (this.app_type === "life") {
      apps_to_copy = this.life_apps;
      console.log(this.life_apps);
    } else if (this.app_type === "auto") {
      apps_to_copy = this.auto_apps;
      console.log(this.auto_apps);
    } else if (this.app_type === "bank") {
      apps_to_copy = this.bank_apps;
      console.log(this.bank_apps);
    } else if (this.app_type === "fire") {
      apps_to_copy = this.fire_apps;
      console.log(this.fire_apps);
    } else if (this.app_type === "health") {
      apps_to_copy = this.health_apps;
      console.log(this.health_apps);
    } else if (this.app_type === "mutual-funds") {
      apps_to_copy = this.mutual_funds_apps;
      console.log(this.mutual_funds_apps);
    }
    for (const app of apps_to_copy) {
      this.apps.push(app);
    }

    // by default it sorts the apps by date
    this.apps.sort((a, b) => a.date.localeCompare(b.date));
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
          app.id = snap.key;
        }
       })
    );
  }

  orderList(filter: string) {
    if (filter == "date") {
      this.apps.sort((a, b) => a.date.localeCompare(b.date));
    } else if (filter == "client_name") {
      this.apps.sort((a, b) => a.client_name.localeCompare(b.client_name));
    } else if (filter == "producer") {
      this.apps.sort((a, b) => this.getProducerName(a.producer_id).localeCompare(this.getProducerName(b.producer_id)));
    }
  }

  getProducerName(id: string) {
    for (const producer of this.producers) {
      if (producer.id == id) {
        return producer.name;
      }
    }
  }

  confirmDelete(app: Application) {
    // change to display app type and client name
    let type = this.app_type;
    if (this.app_type == "mutual-funds") {
      type = "Mutual Funds";
    } else {
      type = type.charAt(0).toUpperCase() + type.slice(1);
    }
    document.getElementById('modalDeleteMessage').innerHTML = "Press confirm to remove " + app.client_name + "'s " + type + " app.";
    this.selected_app_id = app.id;
    this.router.navigate([this.app_type]);
  }

  deleteApp() {
    // clears out the set of the selected app type
    if (this.app_type === "life") {
      this.life_apps = new Set();
    } else if (this.app_type === "auto") {
      this.auto_apps  = new Set();
    } else if (this.app_type === "bank") {
      this.bank_apps = new Set();
    } else if (this.app_type === "fire") {
      this.fire_apps = new Set();
    } else if (this.app_type === "health") {
      this.health_apps = new Set();
    } else if (this.app_type === "mutual-funds") {
      this.mutual_funds_apps = new Set();
    }

    let id = this.selected_app_id;
    this.db.list('applications/'+id).remove();
    for (let i = 0; i < this.apps.length; i++) {
      if (id == this.apps[i].id) {
        this.apps.splice(i);
        break;
      }
    }
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { Producer } from "../producer";
import { Application } from '../application';
import { AngularFireDatabase } from '@angular/fire/database';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormBuilder, FormGroup } from '@angular/forms';

import { DataService } from '../data.service';
import { take } from 'rxjs/operators';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-apps-list',
  templateUrl: './apps-list.component.html',
  styleUrls: ['./apps-list.component.scss']
})
export class AppsListComponent implements OnInit {

  @Input() app_type: string = "";
  @Input() month: number = 0;
  headers: string[] = ["#", "Date", "Producer", "Client"];
  apps = [];
  monthForm: FormGroup = this.fb.group({ });
  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  all_apps: Application[] = [];
  apps_loaded = false;
  prod_loaded = false;
  applications = {
    'life': [],
    'auto': [],
    'fire': [],
    'health': [],
    'bank': [],
    'mutual-funds': []
  }
  producers: Producer[] = [];

  life_headers: string[] = ["Premium", "Mode", "Annual Premium", "Policy Type", "Product", "Client Type", "Bonus", "Status", "Paid Bonus", "Issue / Bonus Month", "Life Pivot Bonus"];
  auto_headers: string[] = ["Auto Type", "Tiers", "Bonus", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  bank_headers: string[] = ["Product Type", "Bonus", "Status", "Marketing Source"];
  fire_headers: string[] = ["Product", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  health_headers: string[] = ["Premium", "Mode", "Status", "Annual Premium", "Product", "Bonus", "Marketing Source"];
  mutual_funds_headers: string[] = ["Product Type", "Amount", "Marketing Source"];

  apps_by_type = {
    "life": new Set(),
    "auto": new Set(),
    "bank": new Set(),
    "fire": new Set(),
    "health": new Set(),
    "mutual-funds": new Set()
  }

  life_apps = new Set();
  auto_apps = new Set();
  bank_apps = new Set();
  fire_apps = new Set();
  health_apps = new Set();
  mutual_funds_apps = new Set();

  subscriptions: Subscription[] = [];
  year: number = 0;

  isViewingAppList = false;

  selected_app_id = "";
  isHoveringDelete = false;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private dataService: DataService, private router: Router) { }

  ngOnInit(): void {
    let date: Date = new Date(); 
    this.year = date.getFullYear();
    if (this.app_type == "") {
      this.app_type = this.router.url.substring(1);
      this.isViewingAppList = true;
    } else {
      // if app type was passed in, then it makes the tables smaller since it is being used to print the production report
      document.getElementById("appTable").classList.add("table-sm");
    }

    if (this.month == 0) {
      this.month = date.getMonth() + 1;
      this.monthForm = this.fb.group({
        month: [this.month]
      });
    }

    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        if (!this.apps_loaded) {
          this.loadApplications();
        }
        if (!this.prod_loaded) {
          this.loadProducers();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  loadApplications() {
    this.dataService.getApplications(this.year)
    .pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        const app = snap.payload.val();
        const app_id = snap.key;
        const app_date = app["date"] as string;
        const app_month = parseInt(app_date.substring(5, 7));
        app.id = app_id;
        
        // if a month wasn't passed in, or the passed in month matches the app's month then add the app
        if (this.app_type == app["type"]) {
          if (this.month == 0 || this.month == app_month) {
            this.apps_by_type[app["type"]].add(app);
          }
        }

        if (snapshot.length == index+1) {
          this.getHeaders();
          this.getApps();
          this.apps_loaded = true;
        }
      })
    );
  }

  loadProducers() {
    this.dataService.prod_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        if (snap.payload.val().hired && snap.payload.val().licensed) {
          let producer: Producer = {
            name: snap.payload.val().name,
            id: snap.key
          }
          this.producers.push(producer);
        }
        if (snapshot.length == index+1) {
          this.prod_loaded = true;
        }
      })
    );
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
    let apps_to_copy = this.apps_by_type[this.app_type];

    for (const app of apps_to_copy) {
      this.apps.push(app);
    }

    // by default it sorts the apps by most recent
    this.apps.sort((a, b) => b.date.localeCompare(a.date));
  }

  editApp(id: string) {
    //console.log("edit" + id);
    this.router.navigate([this.app_type + '/' + this.year + '/' + id]);
  }

  orderList(filter: string) {
    if (filter == "date") {
      this.apps.sort((a, b) => a.date.localeCompare(b.date));
    } else if (filter == "recent") {
      this.apps.sort((a, b) => b.date.localeCompare(a.date));
    } else if (filter == "client_name") {
      this.apps.sort((a, b) => a.client_name.localeCompare(b.client_name));
    } else if (filter == "producer") {
      this.apps.sort((a, b) => this.getProducerName(a.producer_id).localeCompare(this.getProducerName(b.producer_id)));
    }
  }

  filterByMonth(month: number, producer: string) {
    if (month == -1) {
      this.month = ((document.getElementById("month") as HTMLInputElement).value as unknown) as number;
    } else {
      this.month = month;
    }
    if (producer == "") {
      producer = (document.getElementById("producer") as HTMLInputElement).value;
    }
    this.apps_by_type = {
      "life": new Set(),
      "auto": new Set(),
      "bank": new Set(),
      "fire": new Set(),
      "health": new Set(),
      "mutual-funds": new Set()
    }
    this.dataService.getApplications(this.year).pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        const app = snap.payload.val();
        const app_id = snap.key;
        const app_date = app["date"] as string;
        const app_month = parseInt(app_date.substring(5, 7));
        app.id = app_id;

        let passes_filter = true;
        if (producer != "" && producer != app["producer_id"] && producer != "All Producers") {
          passes_filter = false;
        }
        
        if (this.app_type == app["type"] && passes_filter) {
          if (this.month == 0 || this.month == app_month) {
            // if a month wasn't passed in, or the passed in month matches the app's month then add the app
            this.apps_by_type[app["type"]].add(app);
          }
        }

        if (snapshot.length == index+1) {
          this.getHeaders();
          this.getApps();
        }
       })
    );
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
  }

  deleteApp() {
    let id = this.selected_app_id;
    for (let i = 0; i < this.apps.length; i++) {
      if (id == this.apps[i].id) {
        console.log('here');
        this.apps.splice(i, 1);
        break;
      }
    }
    this.db.list('apps/'+this.year+'/'+id).remove();
  }

}

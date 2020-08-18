import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { HealthApp } from '../application';

@Component({
  selector: 'app-add-health',
  templateUrl: './add-health.component.html',
  styleUrls: ['./add-health.component.scss']
})
export class AddHealthComponent implements OnInit {
  producers: Producer[] = PRODUCERS;

  modes: string[] = ["Ann", "Semi", "Q", "Monthly"];
  status_options: string[] = ["Issued", "Withdrawn", "Declined"];
  product_types: string[] = ["Financial Cards", "Deposits", "Retirement"];
  products: string[] = ["Vehicle Loan", "Personal Secured Loan", "HELOC", "Home Equity Loan", "Mortgage Loan", "   ------", "Credit Cards", "Checking/Savings/MM", "   ------", "CD - Standard", "CD - Special", "Coverdell ESA CD", "Roth", "Traditional IRA", "Trust / Estate"];

  private today = new Date();
  addHealthAppForm = this.fb.group({
    date: [this.today],
    producer_name: ['Select Producer'],
    client_name: [''],
    premium: [],
    mode: ['Select Mode'],
    status: ['Select Status'],
    annual_premium: [],
    product: ['Select Product'],
    bonus: [],
    marketing_source: []
  });

  constructor(private db: AngularFireDatabase, private fb: FormBuilder) {
    db.list('/producers').valueChanges().subscribe(producers => {
      this.producers = producers as Producer[];
    });
    // i think this connection stays open even when leaving page, so look into how you do a once check
  }

  ngOnInit(): void {
  }

  get(field: string) {
    return this.addHealthAppForm.get(field).value;
  }
  
  addApp() {
    console.log("add");
    let newApp: HealthApp = {
      type: "health",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      premium: this.get("premium"),
      mode: this.get("mode"),
      status: this.get("status"),
      annual_premium: this.get("annual_premium"),
      product: this.get("product"),
      bonus: this.get("bonus"),
      marketing_source: this.get("marketing_source")
    }
    console.log(newApp);

    let id = this.randomString(16);
    this.db.list('/applications').update(id, newApp);

    // after add should redirect to app page and maybe bring up alert saying successfully added app
  }

  randomString(length: number) {
    // returns a random alphanumerica string of the inputed length
    let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
    let randString = "";
    for (let i = 0; i < length; i++) {
      randString += chars[Math.floor(Math.random() * chars.length)];
    }
    return randString;
  }
}
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { LifeApp } from '../application';

@Component({
  selector: 'app-add-life',
  templateUrl: './add-life.component.html',
  styleUrls: ['./add-life.component.scss']
})
export class AddLifeComponent implements OnInit {
  producers: Producer[] = PRODUCERS;

  modes: string[] = ["Ann", "Semi", "Q", "Monthly"];
  policy_types: string[] = ["Permanent", "Term"];
  products: string[] = ["WL", "UL", "..."];
  client_types: string[] = ["New", "Add", "COP", "CONV", "JUV"];
  status_options: string[] = ["U/W", "Taken", "Not Taken", "Rejected", "Withdrawn", "Pending"];
  life_pivot_bonuses: string[] = ["Full", "80%", "20%", "..."];

  private today = new Date();
  addLifeAppForm = this.fb.group({
    date: [this.today],
    producer_name: ['Select Producer'],
    client_name: [''],
    premium: [],
    mode: ['Select Mode'],
    annual_premium: [],
    policy_type: ['Select Policy Type'],
    product: ['Select Product'],
    client_type: ['Select Client Type'],
    bonus: [],
    bound: [false],
    status: ['Select Status'],
    paid_bonus: [],
    issue_month: ['Select Issue Month'],
    life_pivot_bonus: ['Select Pivot Bonus']
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
    return this.addLifeAppForm.get(field).value;
  }
  
  addApp() {
    console.log("add");
    let newApp: LifeApp = {
      type: "life",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      premium: this.get("premium"),
      mode: this.get("mode"),
      annual_premium: this.get("annual_premium"),
      policy_type: this.get("policy_type"),
      product: this.get("product"),
      client_type: this.get("client_type"),
      bonus: this.get("bonus"),
      bound: this.get("bound"),
      status: this.get("status"),
      paid_bonus: this.get("paid_bonus"),
      issue_month: this.get("issue_month"),
      life_pivot_bonus: this.get("life_pivot_bonus")
    }
    console.log(newApp);

    let id = this.randomString(16);
    this.db.list('/applications').update(id, newApp);
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

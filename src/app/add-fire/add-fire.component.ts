import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { FireApp } from '../application';

@Component({
  selector: 'app-add-fire',
  templateUrl: './add-fire.component.html',
  styleUrls: ['./add-fire.component.scss']
})
export class AddFireComponent implements OnInit {
  producers: Producer[] = PRODUCERS;

  products: string[] = ["Homeowners", "Renters", "PLUP", "PAP", "RDP", "Condo", "Manufac Home", "Boat", "Contractors", "Business", "Workmans Comp", "Bonds", "FLOOD", "CLUP"];
  status_options: string[] = ["Issued", "Declined", "Canceled"];

  private today = new Date();
  addFireAppForm = this.fb.group({
    date: [this.today],
    producer_name: ['Select Producer'],
    client_name: [],
    product: ['Select Product'],
    submitted_premium: [],
    status: ['Select Status'],
    issued_premium: [],
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
    return this.addFireAppForm.get(field).value;
  }
  
  addApp() {
    console.log("add");
    let newApp: FireApp = {
      type: "fire",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      product: this.get("product"),
      submitted_premium: this.get("submitted_premium"),
      status: this.get("status"),
      issued_premium: this.get("issued_premium"),
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

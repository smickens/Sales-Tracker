import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Producer, PRODUCERS } from "../producer";
import { AngularFireDatabase } from 'angularfire2/database';
import { AutoApp } from '../application';

@Component({
  selector: 'app-add-auto',
  templateUrl: './add-auto.component.html',
  styleUrls: ['./add-auto.component.scss']
})
export class AddAutoComponent implements OnInit {
  producers: Producer[] = PRODUCERS;

  auto_types: string[] = ["R/N", "Added", "State to State", "Prior SF", "Reinstated"];
  tiers: string[] = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5", "Tier 6"];

  private today = new Date();
  addAutoAppForm = this.fb.group({
    date: [this.today],
    producer_name: ['Select Producer'],
    client_name: [''],
    auto_type: ['Select Auto Type'],
    tiers: ['Select Tier'],
    bonus: [],
    submitted_premium: [],
    issued: [false],
    issued_premium: [],
    marketing_source: ['Select Marketing Source']
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
    return this.addAutoAppForm.get(field).value;
  }
  
  addApp() {
    console.log("add");
    let newApp: AutoApp = {
      type: "auto",
      date: this.get("date"),
      client_name: this.get("client_name"),
      producer_name: this.get("producer_name"),
      auto_type: this.get("auto_type"),
      tiers: this.get("tiers"),
      bonus: this.get("bonus"),
      submitted_premium: this.get("submitted_premium"),
      issued: this.get("issued"),
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

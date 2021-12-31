import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  active_page = 'producers';
  headers = [];
  constants = [];

  addProducerForm = this.fb.group({
    new_producer: [],
    pin: []
  });

  addConstantForm = this.fb.group({
    new_constant: [],
    header: ['default']
  });

  app_types = ["life", "auto", "bank", "fire", "health", "mutual-funds"];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public  db_auth:  AngularFireAuth, private router: Router) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.loadProducerSettings();
      } else {
        // if user is not logged in, reroute them to the login page
        this.router.navigate(['login']);
      }
    });
  }

  async loadProducerSettings() {
    await this.dataService.until(_ => this.dataService.prod_loaded == true);
    this.setActive('producers');
  }

  setActive(page: string) {
    this.active_page = page;
    this.headers = [];
    this.constants = [[]];
    if (this.active_page == 'producers') {
      this.headers = ["Producers", "Licensed"];

      for (const producer of this.dataService.producers) {
        let displayed = false;

        this.constants[0].forEach(prod => {
          if (prod[0] == producer.id) {
            displayed = true;
          }
        });

        if (!displayed && producer.hired) {
          this.constants[0].push([producer.id, producer.name, producer.licensed]);
        }
      }

      this.loadGoals();
    } else {
      this.db.list('constants/' + this.active_page).snapshotChanges().pipe(take(1)).subscribe(
        (snapshot: any) => snapshot.map(snap => {
        let header = snap.key as string;
        if (this.headers.includes(header.split("_").join(" ")) == false) {
          this.headers.push(header.split("_").join(" "));
        }
        while (this.constants.length < this.headers.length) {
          this.constants.push([]);
        }
        let index = this.headers.indexOf(header.split("_").join(" "));
        if (this.constants[index] != snap.payload.val().split("_")) {
          this.constants[index] = snap.payload.val().split("_");
        }
      }));
    }
  }

  get(form: FormGroup, field: string) {
    return form.get(field).value;
  }

  delete() {
    let delete_type = (document.getElementById('type') as HTMLInputElement).value;
    let delete_data = (document.getElementById('data') as HTMLInputElement).value.split(",");

    if (delete_type == "constant") {
      this.deleteConstant(Number(delete_data[0]), Number(delete_data[1]))
    } else if (delete_type == "producer") {
      this.deleteProducer(delete_data[0], Number(delete_data[1]));
    }
  }

  addProducer() {
    const name = this.get(this.addProducerForm, "new_producer");
    const pin = this.get(this.addProducerForm, "pin");
    const color = (document.getElementById("color") as HTMLInputElement).value;
    const hover_color = this.adjustColor(color, -45);
    const corp_color = this.adjustColor(hover_color, -45);
    if (name.trim() != "" && pin != "") {
      let id = this.randomProducerID();
      let producer = {
        name: name.trim(),
        pin: pin,
        color: color,
        hover_color: hover_color,
        corp_color: corp_color,
        hired: true,
        licensed: false
      }
      this.db.list('producers').update(id, producer);
      // clears input field
      this.addProducerForm.setValue({new_producer: '', pin: ''});
      this.addConstantForm.setValue({new_constant: '', header: ''});
    }

    (document.getElementById("new_producer") as HTMLInputElement).value = "";
  }

  adjustColor(col, amt) {
    col = col.replace(/^#/, '')
    if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]
  
    let [r, g, b] = col.match(/.{2}/g);
    ([r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt])
  
    r = Math.max(Math.min(255, r), 0).toString(16)
    g = Math.max(Math.min(255, g), 0).toString(16)
    b = Math.max(Math.min(255, b), 0).toString(16)
  
    const rr = (r.length < 2 ? '0' : '') + r
    const gg = (g.length < 2 ? '0' : '') + g
    const bb = (b.length < 2 ? '0' : '') + b

    return `#${rr}${gg}${bb}`
  }

  toggleLicensed(id: string, cur: boolean) {
    for (let i = 0; i < this.constants[0].length; i++) {
      const producer = this.constants[0][i];
      if (producer[0] == id) {
        producer[2] = !producer[2];
        this.db.list('producers').update(id, { licensed: !cur });
        break;
      }
    }
  }

  confirmProducerDelete(id: string, constant_index: number) {
    document.getElementById('modalDeleteMessage').innerHTML = "Press confirm to remove producer \"" + this.constants[0][constant_index][1] + "\".";
    let delete_type = document.getElementById('type') as HTMLInputElement;
    delete_type.value = "producer";
    let delete_data = document.getElementById('data') as HTMLInputElement;
    delete_data.value = id + ", " + constant_index;
  }

  deleteProducer(id: string, constant_index: number) {
    this.db.list('producers/' + id).remove();
    this.constants[0].splice(constant_index, 1);
  }

  addConstant() {
    let app_type = this.active_page;
    let header = this.get(this.addConstantForm, 'header').toLowerCase();
    let new_constant = this.get(this.addConstantForm, 'new_constant');

    // only adds constant if, a header was selected
    if (header != "default") {
      let header_index = this.headers.indexOf(header.toLowerCase());
      this.constants[header_index].push(new_constant);

      let constant = {};
      constant[header.split(" ").join("_")] = this.constants[header_index].join("_");
      this.db.list('constants/' + app_type + '/').update('/', constant);

      (document.getElementById("new_constant") as HTMLInputElement).value = "";
    }
  }

  confirmConstDelete(header_index: number, constant_index: number) {
    document.getElementById('modalDeleteMessage').innerHTML = "Press confirm to remove " + this.active_page + "'s " + this.headers[header_index] + " constant - \"" + this.constants[header_index][constant_index] + "\".";
    let delete_type = document.getElementById('type') as HTMLInputElement;
    delete_type.value = "constant";
    let delete_data = document.getElementById('data') as HTMLInputElement;
    delete_data.value = header_index + ", " + constant_index;
  }

  deleteConstant(header_index: number, constant_index: number) { 
    // brings up modal, confirming deletion of producer or constant
    let app_type = this.active_page;
    let header = this.headers[header_index];
    // console.log(header);
    // removes constant from array
    this.constants[header_index].splice(constant_index, 1);
    // console.log(this.constants[header_index]);

    // updates database with removed
    let constant = {};
    constant[header] = this.constants[header_index].join("_");
    this.db.list('constants/' + app_type + '/').update('/', constant);
  }

  randomProducerID() {
    let random_id = "";
    let id_taken = true; 
    while (id_taken) {
      random_id = this.randomString(4);
      let ref = this.db.database.ref("producers");
      id_taken = false; 
      ref.orderByKey().on("child_added", function(snapshot) {
        // console.log(snapshot.key);
        if (snapshot.key == random_id) {
          id_taken = true;
        }
      });
    }
    return random_id;
  }

  loadGoals() {
    this.dataService.goals_ob.pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map(snap => {
        (document.getElementById(snap.key+"_weekly") as HTMLInputElement).value = snap.payload.val()["weekly"];
        (document.getElementById(snap.key+"_monthly") as HTMLInputElement).value = snap.payload.val()["monthly"];
        (document.getElementById(snap.key+"_yearly") as HTMLInputElement).value = snap.payload.val()["yearly"];
      }
    ));
  }

  getGoal(id: string) {
    return (document.getElementById(id) as HTMLInputElement).value;
  }

  updateGoals() {
    this.app_types.forEach(type => {
      let goals = {
        "weekly": Number(this.getGoal(type+"_weekly")),
        "monthly": Number(this.getGoal(type+"_monthly")),
        "yearly": Number(this.getGoal(type+"_yearly"))
      };
      this.db.list('goals').update(type, goals);
    });
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

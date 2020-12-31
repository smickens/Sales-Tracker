import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Producer } from "../producer";
import { AngularFireDatabase } from '@angular/fire/database';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
    new_producer: []
  });
  addConstantForm = this.fb.group({
    new_constant: [],
    header: []
  });

  subscription: Subscription;

  movies = [
    'Episode I - The Phantom Menace',
    'Episode II - Attack of the Clones',
    'Episode III - Revenge of the Sith',
    'Episode IV - A New Hope',
    'Episode V - The Empire Strikes Back',
    'Episode VI - Return of the Jedi',
    'Episode VII - The Force Awakens',
    'Episode VIII - The Last Jedi',
    'Episode IX – The Rise of Skywalker'
  ];

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private router: Router) {
    this.subscription = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
        this.setActive('producers');
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });

    //this.setActive('producers');
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setActive(page: string) {
    this.active_page = page;
    this.headers = [];
    this.constants = [[]];

    // have them not keep listening
    // .unsubscribe() ends the listening but need a way to know when they're finished first

    if (this.active_page == 'producers') {
      this.headers = ["Producers"];
      this.db.list('producers').snapshotChanges().subscribe(
        (snapshot: any) => snapshot.map(snap => {
          let displayed = false;
          this.constants[0].forEach(producer => {
            if (producer[0] == snap.key) {
              displayed = true;
            }
          });

          if (!displayed) {
            this.constants[0].push([snap.key, snap.payload.val().name]);
          }
          //console.log(this.constants);
      }));
    } else {
      this.db.list('constants/' + this.active_page).snapshotChanges().subscribe(
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
    console.log(delete_data);
    console.log(delete_type)
    if (delete_type == "constant") {
      this.deleteConstant(Number(delete_data[0]), Number(delete_data[1]))
    } else if (delete_type == "producer") {
      this.deleteProducer(Number(delete_data[0]), Number(delete_data[1]));
    }
  }

  addProducer() {
    let name = this.get(this.addProducerForm, "new_producer");
    if (name.trim() != "") {
      let id = this.randomProducerID();
      let producer: Producer = {
        name: this.get(this.addProducerForm, "new_producer")
      }
      this.db.list('producers').update(id, producer);

      // clears input field
      this.addProducerForm.setValue({new_producer: ''});
      this.addConstantForm.setValue({new_constant: '', header: ''});
    }

    (document.getElementById("new_producer") as HTMLInputElement).value = "";
  }

  confirmProducerDelete(id: number, constant_index: number) {
    document.getElementById('modalDeleteMessage').innerHTML = "Press confirm to remove producer \"" + this.constants[0][constant_index][1] + "\".";
    let delete_type = document.getElementById('type') as HTMLInputElement;
    delete_type.value = "producer";
    let delete_data = document.getElementById('data') as HTMLInputElement;
    delete_data.value = id + ", " + constant_index;
  }

  deleteProducer(id: number, constant_index: number) {
    console.log("delete producer " + id);
    this.db.list('producers/' + id).remove();
    this.constants[0].splice(constant_index, 1);
  }

  addConstant() {
    // brings up modal, confirming addition of producer or constant
    let app_type = this.active_page;
    let header = this.get(this.addConstantForm, 'header').toLowerCase();
    let new_constant = this.get(this.addConstantForm, 'new_constant');

    let header_index = this.headers.indexOf(header.toLowerCase());
    this.constants[header_index].push(new_constant);

    let constant = {};
    constant[header.split(" ").join("_")] = this.constants[header_index].join("_");
    this.db.list('constants/' + app_type + '/').update('/', constant);

    (document.getElementById("new_constant") as HTMLInputElement).value = "";
  }

  confirmConstDelete(header_index: number, constant_index: number) {
    document.getElementById('modalDeleteMessage').innerHTML = "Press confirm to remove " + this.active_page + "'s " + this.headers[header_index] + " constant - \"" + this.constants[header_index][constant_index] + "\".";
    let delete_type = document.getElementById('type') as HTMLInputElement;
    delete_type.value = "constant";
    let delete_data = document.getElementById('data') as HTMLInputElement;
    delete_data.value = header_index + ", " + constant_index;
  }

  deleteConstant(header_index: number, constant_index: number) { 
    console.log("delete constant ");
    // brings up modal, confirming deletion of producer or constant
    let app_type = this.active_page;
    let header = this.headers[header_index];
    console.log(header);
    // removes constant from array
    this.constants[header_index].splice(constant_index, 1);
    console.log(this.constants[header_index]);

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
        console.log(snapshot.key);
        if (snapshot.key == random_id) {
          id_taken = true;
        }
      });
    }
    return random_id;
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

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
  }

}

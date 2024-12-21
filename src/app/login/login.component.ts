import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';

import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuth } from '@angular/fire/auth';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup = this.fb.group({ 
    email: [''],
    password: ['']
  });
  // subscription: Subscription;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, private dataService: DataService, public  db_auth:  AngularFireAuth, private router: Router) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.subscribe(user => {
      if (user) {
        this.router.navigate(['home']);
        environment.logged_in = true;
      } else {
        environment.logged_in = false;
      }
    });
  }

  // ngOnDestroy(): void {
  //   this.subscription.unsubscribe();
  // }

  get(field: string) {
    return this.loginForm.get(field).value;
  }

  async login() {
    await this.db_auth.signInWithEmailAndPassword(this.get("email").trim(), this.get("password"));
  }

}

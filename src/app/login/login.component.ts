import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';

import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';

import { ActivatedRoute } from "@angular/router";  //  holds information about the route to this instance of the HeroDetailComponent
import { Location } from "@angular/common"; // Angular service for interacting with the browser
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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

  subscription: Subscription;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private router: Router) {
    this.subscription = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
        this.router.navigate(['home']);
      } else {
        environment.logged_in = false;
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get(field: string) {
    return this.loginForm.get(field).value;
  }

  async login() {
    let result = await this.db_auth.auth.signInWithEmailAndPassword(this.get("email").trim(), this.get("password"));
  }

}

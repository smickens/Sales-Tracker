import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { Subscription } from 'rxjs';
import { Application } from './application';
import { Producer } from './producer';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  applications = {
    'life': [],
    'auto': [],
    'fire': [],
    'health': [],
    'bank': [],
    'mutual-funds': []
  }
  producers: Producer[] = [];
  subscriptions: Subscription[] = [];

  auth_state_ob: Observable<any>
  apps_ob: Observable<any[]>;
  prod_ob: Observable<any[]>;
  goals_ob: Observable<any[]>;
  notes_ob: Observable<any[]>;
  
  constructor(private db: AngularFireDatabase, public  db_auth:  AngularFireAuth, private router: Router) {
    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
        this.loadProducers();
      } else {
        // if user is not logged in, then reroute them to the login page
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);

    this.auth_state_ob = db_auth.authState;
    this.apps_ob = db.list('applications').snapshotChanges();
    this.prod_ob = db.list('producers').snapshotChanges();
    this.goals_ob = db.list('goals').snapshotChanges();
    this.notes_ob = db.list('notes').snapshotChanges();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  // async getAuthState() {
  //   for (let i = 0; i < 10; i++) {
  //     if (environment.logged_in) {
  //       return true;
  //     }
  //     await this.delay(100);
  //   }
  //   return environment.logged_in;
  // }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  loadProducers() {
    this.prod_ob.subscribe(
      (snapshot: any) => snapshot.map(snap => {
        let producer: Producer = {
          name: snap.payload.val().name,
          id: snap.key,
          pin: snap.payload.val().pin,
          color: snap.payload.val().color,
          corp_color: snap.payload.val().corp_color,
          hover_color: snap.payload.val().hover_color
        }
        this.producers.push(producer);
      }
    ));
  }

  // getApplications(): Observable<Application[]> {
  //   return this.apps_ob;
  // }

  // getProducers(): Observable<Producer[]> {
  //   return this.prod_ob;
  // }

}

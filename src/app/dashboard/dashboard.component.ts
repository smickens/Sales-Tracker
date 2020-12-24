import { Component, OnInit } from '@angular/core';
import { Producer } from "../producer";
import { Color } from "ng2-charts";
import { Observable, Subscription } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/database';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true
  };

  public barChartLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  public barChartType = 'bar';
  public barChartLegend = false;

  public barChartData = [
    {data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: ''}
  ];

  public barChartColors: Color[] = [
    { backgroundColor: '#E8AA9F' }
  ]

  apps_loaded = false;
  
  subscriptions: Subscription[] = [];

  constructor(private db: AngularFireDatabase, public  db_auth:  AngularFireAuth, private router: Router) { 

    // this.loadAppTotals().subscribe(message => {
    //     console.log(message);
    //     this.apps_loaded = true;
    // });

    let auth_sub = db_auth.authState.subscribe(user => {
      if (user) {
        environment.logged_in = true;
        
        this.db.list('applications').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
            const date = snap.payload.val().date as string;
            const month = parseInt(date.substring(5, 7));
            this.barChartData[0].data[month-1] += 1;
            this.apps_loaded = true;
          })
        );
      } else {
        environment.logged_in = false;
        this.router.navigate(['login']);
      }
    });
    this.subscriptions.push(auth_sub);

    // this.db.list('applications').snapshotChanges().subscribe(
    //   (snapshot: any) => snapshot.map(snap => {
    //     const date = snap.payload.val().date as string;
    //     const month = parseInt(date.substring(5, 7));
    //     console.log(month);
    //     this.barChartData[0].data[month-1] += 1;

    //     total += 1;
    //     if (total == 3) {
    //       this.apps_loaded = true;
    //     }
    //    })
    // );
  }

  ngOnInit(): void {
  }

  loadAppTotals(): Observable<string> {
    return Observable.create(observer => {
        this.db.list('applications').snapshotChanges().subscribe(
          (snapshot: any) => snapshot.map(snap => {
            const date = snap.payload.val().date as string;
            const month = parseInt(date.substring(5, 7));
            this.barChartData[0].data[month-1] += 1;
            observer.complete();
            this.apps_loaded = true;
          })
        );
    });
  }

  toggleUser(producer: Producer): void {
    //producer.showing = !producer.showing;
  }

  chartClicked(): void {
    //console.log("chart clicked");
  }

  chartHovered(): void {
    //console.log("chart hovered");
  }

}

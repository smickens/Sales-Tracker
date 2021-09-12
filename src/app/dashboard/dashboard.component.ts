import { Component, OnInit } from '@angular/core';
import { Producer } from "../producer";
import { Color } from "ng2-charts";
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

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

  constructor(public db_auth:  AngularFireAuth, private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        this.loadApplications();
      }
    });
  }

  loadApplications() {
    let today = new Date();
    this.dataService.getApplications(today.getFullYear()).pipe(take(1)).subscribe(
      (snapshot: any) => snapshot.map((snap, index) => {
        const date = snap.payload.val().date as string;
        const month = parseInt(date.substring(5, 7));
        const status = snap.payload.val().status as string;

        if (status == "Cancelled" || status == "Declined") {
          return;
        }

        this.barChartData[0].data[month-1] += 1;
        if (snapshot.length == index+1) {
          this.apps_loaded = true;
        }
      })
    );
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

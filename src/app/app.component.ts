import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'state-farm-app-tracker';
  display_sidebar = false;
  cur_month: number;

  ngOnInit(): void {  
    let today = new Date();  
    this.cur_month = today.getMonth() + 1;
  }

  openSidebar() {
    this.display_sidebar = true;
    document.getElementById("sidebar").style.width = "180px";
    document.getElementById("openBtn").style.display = "none";
    document.getElementById("closeBtn").style.display = "block";
    document.getElementById("main-view").style.marginLeft = "180px";
  }

  closeSidebar() {
    this.display_sidebar = false;
    document.getElementById("sidebar").style.width = "50px";
    document.getElementById("openBtn").style.display = "block";
    document.getElementById("closeBtn").style.display = "none";
    document.getElementById("main-view").style.marginLeft = "50px";
  }

  onActivate(event: any) {
    if (event.changedMonth) {
      event.changedMonth.subscribe((newMonth: number) => {
        this.cur_month = newMonth;
      });
    }
  }
}

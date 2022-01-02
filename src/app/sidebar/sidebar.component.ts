import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  // env is used in html to only display sidebar if user is logged in
  env = environment;

  year: number;
  
  constructor(public db_auth: AngularFireAuth, private router: Router) { }

  ngOnInit(): void {
    let url_values = this.router.url.split('/')
    if (parseInt(url_values[url_values.length-1])) {
      this.year = parseInt(url_values[url_values.length-1]);
    } else {
      this.year = (new Date()).getFullYear();
    }
  }

  async logout(){
    await this.db_auth.signOut();
  }

}

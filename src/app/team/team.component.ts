import { Component, OnInit } from '@angular/core';
import { User, USERS } from "../user";

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {

  users: User[] = USERS;

  constructor() { }

  ngOnInit(): void {
  }

  toggleUser(user: User): void {
    user.showing = !user.showing;
  }

}

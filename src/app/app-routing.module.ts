import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainViewComponent } from './main-view/main-view.component';
import { SettingsComponent } from './settings/settings.component';
import { BonusesComponent } from './bonuses/bonuses.component';

import { AddLifeComponent } from './add-life/add-life.component';
import { AddAutoComponent } from './add-auto/add-auto.component';
import { AddBankComponent } from './add-bank/add-bank.component';
import { AddFireComponent } from './add-fire/add-fire.component';
import { AddHealthComponent } from './add-health/add-health.component';

import { AppsListComponent } from './apps-list/apps-list.component';

const routes: Routes = [
  // default page
  { path: '', redirectTo: '/main-view', pathMatch: 'full'},

  // main pages
  { path: 'main-view', component: MainViewComponent },
  { path: 'bonuses', component: BonusesComponent },
  { path: 'settings', component: SettingsComponent },

  // add app forms
  { path: 'add-life', component: AddLifeComponent },
  { path: 'add-auto', component: AddAutoComponent },
  { path: 'add-bank', component: AddBankComponent },
  { path: 'add-fire', component: AddFireComponent },
  { path: 'add-health', component: AddHealthComponent },

  // edit app forms
  { path: 'life/:id', component: AddLifeComponent },
  { path: 'auto/:id', component: AddAutoComponent },
  { path: 'bank/:id', component: AddBankComponent },
  { path: 'fire/:id', component: AddFireComponent },
  { path: 'health/:id', component: AddHealthComponent },

  // app list pages
  { path: ':type', component: AppsListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

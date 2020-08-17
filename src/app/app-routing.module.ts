import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings/settings.component';
import { AddLifeComponent } from './add-life/add-life.component';
import { MainViewComponent } from './main-view/main-view.component';
import { AppsListComponent } from './apps-list/apps-list.component';
import { AddAutoComponent } from './add-auto/add-auto.component';

const routes: Routes = [
  { path: '', redirectTo: '/main-view', pathMatch: 'full'},
  { path: 'main-view', component: MainViewComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'add-life', component: AddLifeComponent },
  { path: 'add-auto', component: AddAutoComponent },
  //{ path: 'edit-life', component: AddLifeComponent },
  //{ path: 'life/:id', component: AddLifeComponent },
  { path: ':type', component: AppsListComponent }
];

// { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
//   { path: 'dashboard', component: DashboardComponent },
//   { path: 'detail/:id', component: HeroDetailComponent },
//   { path: 'apps/:type', component: AppDetailComponent },
//   { path: 'heroes', component: HeroesComponent }


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

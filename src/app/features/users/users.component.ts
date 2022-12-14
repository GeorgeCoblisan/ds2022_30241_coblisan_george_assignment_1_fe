import { Component, OnInit } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';

import { Observable, Subject } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

import { User } from 'src/app/core/models/user.model';
import { LoginService } from 'src/app/core/services/login.service';
import { AddUserDialogComponent } from 'src/app/shared/add-user-dialog/add-user-dialog.component';
import { EnergyApiClientService } from '../services/energy-api-client.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  users: User[] | undefined;

  createdUser: User | undefined;

  firstName!: string;
  lastName!: string;
  email!: string;
  password!: string;

  private reloadUsers$ = new Subject();

  users$: Observable<User[]> = this.reloadUsers$.pipe(
    startWith(undefined),
    switchMap(() => this.energyApiClient.getUsers())
  );

  constructor(
    private energyApiClient: EnergyApiClientService,
    private dialog: MatDialog,
    private loginService: LoginService,
  ) {}

  ngOnInit(): void {
    this.reloadUsers$.next(0);
    this.energyApiClient
      .getUsers()
      .subscribe(
        (users) => (this.users = users.filter((user) => user.role === 'client'), this.loginService.setUsers(users))
      );
  }

  addUser(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px',
      data: { firstName: this.firstName, lastName: this.lastName, email: this.email, password: this.password, message: 'Add a new client'},
    });

    dialogRef.afterClosed().subscribe(result => {
      this.createdUser = result;
      this.energyApiClient.createUser(this.createdUser!).subscribe(() => this.refreshUsers());
      this.reloadUsers$.next(0);
    });
  }

  deleteUser(userId: string): void {
    this.energyApiClient.deleteUser(userId).subscribe(() => this.refreshUsers());
  }

  editUser(userId: string): void {
    const user = this.users?.find((user) => user.id === userId);

    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '400px',
      data: { firstName: user!.firstName, lastName: user!.lastName, email: user!.email, password: user!.password, message: 'Edit client' },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.createdUser = result;
      if (this.createdUser) {
        this.energyApiClient.editUser(userId, this.createdUser!).subscribe(() => this.refreshUsers());
      }
    });
  }

  refreshUsers() {
    this.reloadUsers$.next(0);
  }
}

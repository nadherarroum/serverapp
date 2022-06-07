import { Server } from './interface/server';
import { Status } from './enum/status.enum';
import { DataState } from './enum/data-state.enum';
import { CustomResponse } from './interface/custom-response';
import { AppState } from './interface/app-state';
import {
  Observable,
  map,
  startWith,
  catchError,
  of,
  BehaviorSubject,
} from 'rxjs';
import { ServerService } from './service/server.service';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NotificationService } from './service/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse>>;

  readonly DataState = DataState;
  readonly Status = Status;

  private dataSubject = new BehaviorSubject<CustomResponse>(null);

  private filterSubject = new BehaviorSubject<string>('');
  filterSubject$ = this.filterSubject.asObservable();

  private isLoading = new BehaviorSubject<Boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor(
    private serverService: ServerService,
    private notifier: NotificationService
  ) {}

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$.pipe(
      map((response) => {
        this.notifier.onDefault(response.message);
        this.dataSubject.next(response); // save response on data subject
        return {
          dataState: DataState.LOADED_STATE,
          appData: {
            ...response,
            data: { servers: response.data.servers.reverse() },
          },
        };
      }),
      startWith({ dataState: DataState.LOADING_STATE }),
      catchError((error: string) => {
        this.notifier.onError(error);
        return of({ dataState: DataState.ERROR_STATE, error: error });
      })
    );
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress).pipe(
      map((response) => {
        // place the server that the user ping(ipAddress) with the server get to response
        const index = this.dataSubject.value.data.servers.findIndex(
          (server) => server.id === response.data.server.id
        );
        this.dataSubject.value.data.servers[index] = response.data.server;
        this.notifier.onDefault(response.message);
        this.filterSubject.next(''); // after done, stop the loading
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value,
        };
      }),
      startWith({
        dataState: DataState.LOADED_STATE,
        appData: this.dataSubject.value,
      }),
      catchError((error: string) => {
        this.filterSubject.next('');
        this.notifier.onError(error);
        return of({ dataState: DataState.ERROR_STATE, error: error });
      })
    );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService
      .filter$(status, this.dataSubject.value)
      .pipe(
        map((response) => {
          this.notifier.onDefault(response.message);
          return { dataState: DataState.LOADED_STATE, appData: response };
        }),
        startWith({
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value,
        }),
        catchError((error: string) => {
          this.notifier.onError(error);
          return of({ dataState: DataState.ERROR_STATE, error });
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);

    this.appState$ = this.serverService.save$(serverForm.value as Server).pipe(
      map((response) => {
        this.dataSubject.next({
          ...response,
          data: {
            servers: [
              response.data.server,
              ...this.dataSubject.value.data.servers,
            ],
          },
        });
        this.notifier.onDefault(response.message);
        document.getElementById('closeModal').click();
        this.isLoading.next(false);
        serverForm.resetForm({ status: this.Status.SERVER_DOWN });
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value,
        };
      }),
      startWith({
        dataState: DataState.LOADED_STATE,
        appData: this.dataSubject.value,
      }),
      catchError((error: string) => {
        this.isLoading.next(false);
        this.notifier.onError(error);
        return of({ dataState: DataState.ERROR_STATE, error: error });
      })
    );
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id).pipe(
      map((response) => {
        this.dataSubject.next({
          ...response,
          data: {
            servers: this.dataSubject.value.data.servers.filter(
              (s) => s.id !== server.id
            ),
          },
        });
        this.notifier.onDefault(response.message);
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value,
        };
      }),
      startWith({
        dataState: DataState.LOADED_STATE,
        appData: this.dataSubject.value,
      }),
      catchError((error: string) => {
        this.notifier.onError(error);
        return of({ dataState: DataState.ERROR_STATE, error: error });
      })
    );
  }

  printReport(): void {
    this.notifier.onDefault('Report downloading...');
    window.print();

    // let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    // let tableSelect = document.getElementById('servers');
    // let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    // let downloadLink = document.createElement('a');

    // document.body.appendChild(downloadLink);
    // downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    // downloadLink.download = 'server-report.xls';
    // downloadLink.click();
    // document.body.removeChild(downloadLink);
  }
}

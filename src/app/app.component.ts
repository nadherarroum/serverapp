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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse>>;

  readonly DataState = DataState;
  readonly Status = Status;

  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);

  filterSubject$ = this.filterSubject.asObservable();

  constructor(private serverService: ServerService) {}

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$.pipe(
      map((response) => {
        this.dataSubject.next(response); // save response on data subject
        return { dataState: DataState.LOADED_STATE, appData: response };
      }),
      startWith({ dataState: DataState.LOADING_STATE }),
      catchError((error: string) => {
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
        this.filterSubject.next(''); // after done, stop the loading
        return { dataState: DataState.LOADED_STATE, appData: response };
      }),
      startWith({
        dataState: DataState.LOADED_STATE,
        appData: this.dataSubject.value,
      }),
      catchError((error: string) => {
        this.filterSubject.next('');
        return of({ dataState: DataState.ERROR_STATE, error: error });
      })
    );
  }
}

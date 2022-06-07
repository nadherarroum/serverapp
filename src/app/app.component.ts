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
  filterSubject$ = this.filterSubject.asObservable();

  constructor(private serverService: ServerService) {}

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$.pipe(
      map((response) => {
        return { dataState: DataState.LOADED_STATE, appData: response };
      }),
      startWith({ dataState: DataState.LOADING_STATE }),
      catchError((error: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: error });
      })
    );
  }
}

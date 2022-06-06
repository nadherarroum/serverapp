import { Server } from './../interface/server';
import { CustomResponse } from './../interface/custom-response';
import { environment } from './../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Status } from '../enum/status.enum';

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  env = environment;

  constructor(private _http: HttpClient) {}

  servers$ = <Observable<CustomResponse>>(
    this._http
      .get<CustomResponse>(`${this.env.API_URL}/list`)
      .pipe(tap(console.log), catchError(this.handleError))
  );

  save$ = (server: Server) =>
    <Observable<CustomResponse>>(
      this._http
        .post<CustomResponse>(`${this.env.API_URL}/save`, server)
        .pipe(tap(console.log), catchError(this.handleError))
    );

  ping$ = (ipAddress: string) =>
    <Observable<CustomResponse>>(
      this._http
        .get<CustomResponse>(`${this.env.API_URL}/ping/${ipAddress}`)
        .pipe(tap(console.log), catchError(this.handleError))
    );

  filter$ = (status: Status, response: CustomResponse) =>
    <Observable<CustomResponse>>new Observable<CustomResponse>((subscriber) => {
      console.log(response);
      subscriber.next(
        status === Status.ALL
          ? { ...response, message: `Servers filtered by ${status} status` }
          : {
              ...response,
              message:
                response.data.servers.filter(
                  (server) => server.status === status
                ).length > 0
                  ? `Servers filtered by
              ${
                status === Status.SERVER_UP ? 'SERVER UP' : 'SERVER DOWN'
              } status`
                  : `No Servers of ${status} found`,
              data: {
                servers: response.data.servers.filter(
                  (server) => server.status === status
                ),
              },
            }
      );
      subscriber.complete();
    }).pipe(tap(console.log), catchError(this.handleError));

  delete$ = (serverId: number) =>
    <Observable<CustomResponse>>(
      this._http
        .delete<CustomResponse>(`${this.env.API_URL}/delete/${serverId}`)
        .pipe(tap(console.log), catchError(this.handleError))
    );

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(`An error occurred - Error code: ${error.status}`);
  }
}

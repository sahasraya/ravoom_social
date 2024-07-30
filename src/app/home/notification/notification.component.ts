import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { log } from 'console';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit {

 
  APIURL = "http://127.0.0.1:8000/";
  notifications: any[] = [];
  currentUserId: string = ""; 
  opennotificationwindow:boolean=false;

  constructor(private http: HttpClient,private router:Router,private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('wmd') || '';
 
    this.notificationService.getNotificationEvent().subscribe(() => {
      this.getNotifications();
    });
  }

  async getNotifications(): Promise<void> {
    this.opennotificationwindow = !this.opennotificationwindow;
    const formData = new FormData();
    formData.append('userid', this.currentUserId);

    this.http.post<any>(`${this.APIURL}get_notifications`, formData).subscribe({
      next: (response: any) => {
        this.notifications = response;
     
 
 
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
      }
    });
  }


  calculateTimeAgo(postedDate: string): string {
    const now = new Date();
    const postDate = new Date(postedDate);
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else {
      return postDate.toLocaleDateString();
    }
  }
  navigatetocommentscreen(postid:any,notificationid:any,norg:any):void{

   
    const formData = new FormData();
    formData.append('notificationid', notificationid.toString());

    this.http.post<any>(`${this.APIURL}update-notification-clicked`, formData).subscribe({
      next: response => {
        console.log( response);
        
        this.router.navigate(['/home/comment', postid,norg])
 
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
         
      }
    });



  }


  async navigatetogroupscreen(postowneruserid: any, notificationid: any, groupid: any, groupname: string): Promise<void> {
    const formData = new FormData();
    formData.append('notificationid', notificationid.toString());
    formData.append('groupid', groupid);
    formData.append('myuserid', postowneruserid);

    this.http.post<any>(`${this.APIURL}check_group_join_accepted`, formData).subscribe({
        next: (response: any) => {
            if (response.message === "no") {
                alert("You have to wait till your request is accepted");
            } else if (response.message === "yes") {
                this.http.post<any>(`${this.APIURL}update-notification-clicked`, formData).subscribe({
                    next: response => {
                        console.log(response);
                        this.router.navigate(['/home/group', groupid]);
                    },
                    error: (error: HttpErrorResponse) => {
                        console.error('There was an error!', error);
                    }
                });
            }
        },
        error: (error: HttpErrorResponse) => {
            console.error('There was an error!', error);
        }
    });
}



}

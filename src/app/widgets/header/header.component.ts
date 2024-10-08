import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { NotificationService } from '../../home/notification/notification.service';
import { NotificationComponent } from '../../home/notification/notification.component';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AddPostComponent } from '../add-post/add-post.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,RouterModule,SearchComponent,NotificationComponent,AddPostComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  APIURL = environment.APIURL;
  @Output() addPost = new EventEmitter<void>();
  @Output() uploadPost = new EventEmitter<void>();

  userid: string = "";
  showSignOutMessage: boolean = false;
  openaddpostscreenbool:boolean=false;
  searchText: string = '';
  user: any;
  dropdownVisible: boolean = false;
  showtheonlinestatusindicator:boolean = true;
  private openDropdown: HTMLElement | null = null;
  @ViewChild('mainlogo', { static: true }) mainLogo!: ElementRef;
 
  constructor(private notificationService: NotificationService,private http:HttpClient,private renderer: Renderer2) {}

  ngOnInit(): void {
    this.userid = localStorage.getItem('wmd') || '';
    if(this.userid !=''){
      this.getuserdetails(this.userid);
    }


    this.renderer.listen('window', 'load', () => {
      this.updateOnlineStatus(this.userid);

    });

    this.renderer.listen('document', 'visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
         this.updatethehiddenvisibility(this.userid);
      } else if (document.visibilityState === 'visible') {
        
        if (this.mainLogo.nativeElement.offsetWidth > 0 && this.mainLogo.nativeElement.offsetHeight > 0) {
          this.updateOnlineStatus(this.userid);
        }
      }
    });


  }
async updatethehiddenvisibility(userid:any){
  const formData = new FormData();
  
  if (userid) {
    formData.append('userid', userid);

    this.http.post(this.APIURL + 'update_online_status_hidden', formData).subscribe({
      next: (response: any) => {
    
 
        this.showtheonlinestatusindicator=false;
   
      },
      error: error => {
        console.error('There was an error posting the data!', error);
      }
    });
  } else {
    console.error('User ID is not available in session storage.');
  }
}



  async updateOnlineStatus(userid: any): Promise<void> {
    const formData = new FormData();
 
    if (userid) {
      formData.append('userid', userid);
  
      this.http.post(this.APIURL + 'update_online_status', formData).subscribe({
        next: (response: any) => {
 

          this.showtheonlinestatusindicator=true;
   

        },
        error: error => {
          console.error('There was an error posting the data!', error);
        }
      });
    } else {
      console.error('User ID is not available in session storage.');
    }
  }




  openaddpostscreen(): void {
    this.openaddpostscreenbool = true;
    this.addPost.emit();
  }


  showdropdown(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.openDropdown === target) {
      this.closeAllDropdowns();
    } else {
      this.closeAllDropdowns();
      this.dropdownVisible = true;
      this.openDropdown = target;
    }
  }
  onPostAdded(): void {
    this.uploadPost.emit();
  }

  hideDropdown(): void {
    this.dropdownVisible = false;
    this.openDropdown = null;
  }

  async getuserdetails(userid:string):Promise<void>{
    const formData = new FormData();
    formData.append('userid', userid);

    this.http.post<any>(`${this.APIURL}get_user_details`, formData).subscribe({
      next: (response:any) => {
        
        this.user = response;  
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
         
      }
    });
  }
  

  handleSearchText(text: string) {
    this.searchText = text;
  }
  logout(): void {
    const token = localStorage.getItem('jwt');

    if (token) {
   
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      console.log(headers);
      this.http.post(this.APIURL + 'logout', {}, { headers }).subscribe({
        next: (response: any) => {
          console.log('Logged out successfully');
         
          localStorage.clear();
          
        
          this.showSignOutMessage = true;

      
          setTimeout(() => {
            this.showSignOutMessage = false;
            location.reload();
          }, 3000);
        },
        error: (error) => {
          console.error('Logout error:', error);
       
        }
      });
    } else {
      console.log('No token found, skipping logout.');
    
      location.reload();

    }
  }


  

  getNotifications(): void {
    this.updatingusernotificationseenstatus();
    this.notificationService.triggerNotification();
  }

  async updatingusernotificationseenstatus(): Promise<void> {
    const formData = new FormData();
    formData.append('userid', this.userid.toString());

    this.http.post<any>(`${this.APIURL}update_user_notification_seen_status`, formData).subscribe({
        next: (response: any) => {
     
            if (response.message === "seen") {
                this.getuserdetails(this.userid);
            } else {
                console.error('Unexpected response message:', response.message);
            }
        },
        error: (error: HttpErrorResponse) => {
            console.error('There was an error!', error);
        }
    });
}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (this.openDropdown && !this.openDropdown.contains(target)  ) {
      this.closeAllDropdowns();
    }
  }
  closeAllDropdowns(): void {
    this.dropdownVisible = false;
    this.openDropdown = null;
  }
}

import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommentComponent } from '../comment/comment.component';

@Component({
  selector: 'app-video-slider',
  standalone: true,
  imports: [CommonModule,RouterModule,CommentComponent],
  templateUrl: './video-slider.component.html',
  styleUrls: ['./video-slider.component.css']
})
export class VideoSliderComponent implements OnInit, AfterViewInit {

  @ViewChild('videoHolder') videoHolder!: ElementRef<HTMLDivElement>;
  @ViewChildren('videoElement') videoElements!: QueryList<ElementRef<HTMLVideoElement>>;

  APIURL = 'http://127.0.0.1:8000/';
  offset = 0;
  limit = 5;
  isLoading = false;
  getthecommentsBool:boolean = false;
  selectedPostId: string | null = null;
  videoList: any[] = [];

  private scrollListener!: () => void;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.getAllVideoPosts();
  }

  ngAfterViewInit(): void {
    if (this.videoHolder) {
      this.scrollListener = () => this.onScroll();
      this.videoHolder.nativeElement.addEventListener('scroll', this.scrollListener);
      this.initializeIntersectionObserver();
    } else {
      console.error('videoHolder is not defined');
    }
  }



  getthecomments(event: Event, postid: string): void {
    event.stopPropagation();
    this.selectedPostId = postid; 
    this.getthecommentsBool = true; 
  }



  private initializeIntersectionObserver(): void {
    const options = {
      root: this.videoHolder.nativeElement,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const videoElement = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          videoElement.play().catch(error => console.error('Error playing video:', error));
        } else {
          videoElement.pause();
        }
      });
    }, options);

 
    this.videoElements.changes.subscribe(() => {
      this.videoElements.forEach(videoElement => observer.observe(videoElement.nativeElement));
    });
  }

  onScroll(): void {
    if (!this.videoHolder) return;

    const element = this.videoHolder.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const offsetHeight = element.offsetHeight;

    if ((scrollTop + offsetHeight) >= scrollHeight && !this.isLoading) {
      this.getAllVideoPosts();
    }
  }

  async getAllVideoPosts(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.http.get<any[]>(`${this.APIURL}get_all_video_posts_slider?limit=${this.limit}&offset=${this.offset}`).subscribe({
      next: (response: any[]) => {
        const processedVideos = response.map(video => {
       

          if (video.post) {
            const base64Data = video.post;
            const blob = this.convertBase64ToBlob(base64Data, 'video/mp4');
            video.videoUrl = URL.createObjectURL(blob);
          }
          if (video.userprofile) {
            video.profileImageUrl = this.createBlobUrl(video.userprofile, 'image/jpeg');
        }


        video.username = video.username;  
        video.posteddate = video.posteddate;
        video.postdescription = video.postdescription;


          return video;
        });

        this.videoList = [...this.videoList, ...processedVideos];
        this.offset += this.limit;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('There was an error!', error);
        this.isLoading = false;
      }
    });
  }



  base64ToBlob(base64: string, contentType: string = ''): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  createBlobUrl(base64: string, contentType: string): string {
    const blob = this.base64ToBlob(base64, contentType);
    return URL.createObjectURL(blob);
  }






  convertBase64ToBlob(base64: string, mimeType: string): Blob {
    const base64Data = base64.split(',').pop() || base64;
    const byteChars = atob(base64Data);
    const byteNums = new Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNums);
    return new Blob([byteArray], { type: mimeType });
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


  
}
<!-- 
<div class="container">
    <div class="row">
        <div class="panel">
            <div class="cover-photo">
              @if(auth()->user()->banner != null)
              <div class="fb-timeline-img">
                  <img src="{{ auth()->user()->banner }}" alt="">
              </div>
              @else
              <div class="fb-timeline-img" >
                  <img src="http://anylearn.vn/cdn/anylearn/img/logo-color.svg" alt="">
              </div>
              @endif
            </div>
            <div class="panel-body">
            @if(auth()->user()->image != null)
              <div class="profile-thumb">
                  <img src="{{ auth()->user()->image }}" alt="">
              </div>
              <h2 style="margin-top:5px"><a class="text-black" >{{ Auth::user()->name }}</a></h2>
              @else
              <div class="profile-thumb">
                  <img src="http://anylearn.vn/cdn/anylearn/img/logo-color.svg" alt="">
              </div>
              <h2 ><a class="text-black" >{{ Auth::user()->name }}</a></h2>
            @endif
            </div>
        </div>
  </div>
</div>
<p> -->

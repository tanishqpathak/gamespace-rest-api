$(document).ready(() => {
    $('#del').on('click', (e) => {
      $target = $(e.target);
      const id = $target.attr('data-id');
      $.ajax({
        type:'DELETE',
        url: '/games/'+id,
        success: (response) => {
          alert('Deleting Game');
          window.location.href= '/store';
        },
        error: (err) => {
          console.log(err)
        }
      });
    });
  });
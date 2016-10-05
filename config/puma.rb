# From ruby-getting-started/config/puma.rb
# https://github.com/heroku/ruby-getting-started/blob/master/config/puma.rb
#

workers Integer(ENV['WEB_CONCURRENCY'] || 2)
threads_count = Integer(ENV['MAX_THREADS'] || 5)
threads threads_count, threads_count

preload_app!

rackup      DefaultRackup
port        ENV['PORT']     || 3000
environment ENV['RACK_ENV'] || 'development'


#!/usr/bin/env bash
#
# Run jekyll serve and then launch the site

prod=false
command="bundle exec jekyll s -l"
host="127.0.0.1"

require_ruby() {
  if ! command -v ruby >/dev/null 2>&1; then
    echo "Ruby is required. Install Ruby 3.1+ or use the devcontainer." >&2
    exit 1
  fi

  if ! ruby -e 'required = Gem::Version.new("3.1.0"); exit(Gem::Version.new(RUBY_VERSION) >= required ? 0 : 1)'; then
    current="$(ruby -e 'print RUBY_VERSION')"
    echo "Ruby 3.1+ is required for this project (current: $current)." >&2
    echo "Use the devcontainer or match the GitHub Actions runtime (Ruby 3.3)." >&2
    exit 1
  fi
}

require_bundle() {
  if ! bundle check >/dev/null 2>&1; then
    echo "Bundle dependencies are missing. Run 'bundle install' with Ruby 3.1+ first." >&2
    exit 1
  fi
}

help() {
  echo "Usage:"
  echo
  echo "   bash /path/to/run [options]"
  echo
  echo "Options:"
  echo "     -H, --host [HOST]    Host to bind to."
  echo "     -p, --production     Run Jekyll in 'production' mode."
  echo "     -h, --help           Print this help information."
}

while (($#)); do
  opt="$1"
  case $opt in
  -H | --host)
    host="$2"
    shift 2
    ;;
  -p | --production)
    prod=true
    shift
    ;;
  -h | --help)
    help
    exit 0
    ;;
  *)
    echo -e "> Unknown option: '$opt'\n"
    help
    exit 1
    ;;
  esac
done

require_ruby
require_bundle

command="$command -H $host"

if $prod; then
  command="JEKYLL_ENV=production $command"
fi

if [ -e /proc/1/cgroup ] && grep -q docker /proc/1/cgroup; then
  command="$command --force_polling"
fi

echo -e "\n> $command\n"
eval "$command"

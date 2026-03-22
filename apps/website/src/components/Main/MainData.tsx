export interface MainData {
  repo: {
    stars?: number | string;
  };
}

export const loadMainData = async (): Promise<MainData> => {
  const repo = await fetch('https://ungh.cc/repos/riccardoperra/codeimage')
    .then(res => res.json())
    .then(res => res.repo)
    .catch(() => ({stars: '?'}));

  return {
    repo,
  };
};
